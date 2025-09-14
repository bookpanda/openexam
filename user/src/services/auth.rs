use oauth2::basic::BasicTokenType;
use oauth2::{
    AsyncHttpClient, AuthorizationCode, CsrfToken, EndpointNotSet, EndpointSet, ExtraTokenFields,
    Scope, StandardTokenResponse, TokenResponse,
};
use serde::{Deserialize, Serialize};
use tonic::{Request, Response, Status};

use crate::config::config::OAuthConfig;
use crate::proto::auth::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest,
};
use crate::repositories::user::UserRepo;
use jsonwebtoken::{DecodingKey, Validation, decode};
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl, basic::BasicClient};
use reqwest;

#[derive(Debug)]
pub struct AuthService {
    pub user_repo: UserRepo,
    oauth_client:
        BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointNotSet, EndpointSet>,
}

impl AuthService {
    pub fn new(user_repo: UserRepo, oauth_config: OAuthConfig) -> anyhow::Result<Self> {
        let oauth_client = oauth2::basic::BasicClient::new(ClientId::new(oauth_config.client_id))
            .set_client_secret(ClientSecret::new(oauth_config.client_secret))
            .set_auth_uri(AuthUrl::new(oauth_config.auth_url).unwrap())
            .set_token_uri(TokenUrl::new(oauth_config.token_url).unwrap())
            .set_redirect_uri(RedirectUrl::new(oauth_config.redirect_url).unwrap());

        Ok(Self {
            user_repo,
            oauth_client,
        })
    }

    pub fn get_google_login_url(
        &self,
        request: Request<GetGoogleLoginUrlRequest>,
    ) -> Result<Response<GetGoogleLoginUrlReply>, Status> {
        let (auth_url, _) = self
            .oauth_client
            .authorize_url(|| CsrfToken::new_random())
            .add_scope(Scope::new("openid".into()))
            .add_scope(Scope::new("email".into()))
            .add_scope(Scope::new("profile".into()))
            .url();
        Ok(Response::new(GetGoogleLoginUrlReply {
            url: auth_url.to_string(),
        }))
    }

    async fn exchange_google_code(&self, code: String) -> Result<String, anyhow::Error> {
        let code = AuthorizationCode::new(code);

        let http_client = reqwest::ClientBuilder::new()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("Client should build");

        let token_response = self
            .oauth_client
            .exchange_code(code)
            .request_async(&reqwest::Client::new())
            .await?;

        let access_token = token_response.access_token().secret().clone();

        let user_info = get_profile(&access_token).await?;

        println!("Decoded token: {:?}", user_info);

        Ok(access_token.to_string())
    }

    pub async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<LoginReply>, Status> {
        let code = request.into_inner().code;
        let access_token = self
            .exchange_google_code(code)
            .await
            .map_err(|e| Status::internal(format!("Failed to exchange code: {}", e)))?;

        let user_info = get_profile(&access_token)
            .await
            .map_err(|e| Status::internal(format!("Failed to get profile: {}", e)))?;

        Ok(Response::new(LoginReply {
            message: format!("Hello, {}!", user_info.name),
        }))
    }
}

#[derive(Debug, Deserialize)]
pub struct UserInfo {
    pub email: String,
    pub name: String,
    pub sub: String,
}

async fn get_profile(access_token: &str) -> Result<UserInfo, anyhow::Error> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://openidconnect.googleapis.com/v1/userinfo")
        .bearer_auth(access_token.to_owned())
        .send()
        .await?;

    let user_info = response.json::<UserInfo>().await?;
    Ok(user_info)
}

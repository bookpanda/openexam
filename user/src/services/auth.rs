use oauth2::basic::BasicTokenType;
use oauth2::{
    AuthorizationCode, CsrfToken, EndpointNotSet, EndpointSet, ExtraTokenFields, Scope,
    StandardTokenResponse, TokenResponse,
};
use serde::Deserialize;
use tonic::{Request, Response, Status};

use crate::config::config::OAuthConfig;
use crate::proto::auth::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest,
};
use crate::repositories::user::UserRepo;
use jsonwebtoken::{DecodingKey, Validation, decode};
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl, basic::BasicClient};

#[derive(Debug, Deserialize)]
struct GoogleExtraTokenFields {
    id_token: String,
}
type GoogleTokenResponse = StandardTokenResponse<GoogleExtraTokenFields, BasicTokenType>;
impl ExtraTokenFields for GoogleExtraTokenFields {}

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

        let token_response: GoogleTokenResponse = self
            .oauth_client
            .exchange_code(code)
            .request_async(oauth2::reqwest::async_http_client)
            .await?;

        let access_token = token_response.access_token().secret().clone();

        let id_token = token_response.extra_fields().id_token.clone();

        let token_data = decode::<GoogleClaims>(
            &id_token,
            &DecodingKey::from_secret("YOUR_GOOGLE_CLIENT_SECRET".as_ref()),
            &Validation::default(),
        )?;

        Ok(access_token.to_string())
    }

    pub async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<LoginReply>, Status> {
        Ok(Response::new(LoginReply {
            message: "Hello, world!".to_string(),
        }))
    }
}

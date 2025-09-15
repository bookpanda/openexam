use oauth2::{AuthorizationCode, CsrfToken, EndpointNotSet, EndpointSet, Scope, TokenResponse};
use serde::Deserialize;
use tonic::Status;

use crate::config::config::OAuthConfig;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl, basic::BasicClient};
use reqwest;

#[derive(Debug, Deserialize)]
pub struct UserInfo {
    pub email: String,
    pub name: String,
}

#[derive(Debug)]
pub struct OAuthService {
    oauth_client:
        BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointNotSet, EndpointSet>,
}

impl OAuthService {
    pub fn new(oauth_config: OAuthConfig) -> anyhow::Result<Self> {
        let oauth_client = oauth2::basic::BasicClient::new(ClientId::new(oauth_config.client_id))
            .set_client_secret(ClientSecret::new(oauth_config.client_secret))
            .set_auth_uri(AuthUrl::new(oauth_config.auth_url).unwrap())
            .set_token_uri(TokenUrl::new(oauth_config.token_url).unwrap())
            .set_redirect_uri(RedirectUrl::new(oauth_config.redirect_url).unwrap());

        Ok(Self { oauth_client })
    }

    pub fn get_google_login_url(&self) -> String {
        let (auth_url, _) = self
            .oauth_client
            .authorize_url(|| CsrfToken::new_random())
            .add_scope(Scope::new("openid".into()))
            .add_scope(Scope::new("email".into()))
            .add_scope(Scope::new("profile".into()))
            .url();
        auth_url.to_string()
    }

    pub async fn get_access_token(&self, code: &str) -> Result<String, Status> {
        let code = AuthorizationCode::new(code.to_string());

        let token_response = self
            .oauth_client
            .exchange_code(code)
            .request_async(&reqwest::Client::new())
            .await
            .map_err(|e| Status::internal(format!("Failed to get access token: {}", e)))?;

        let access_token = token_response.access_token().secret().clone();

        Ok(access_token.to_string())
    }

    pub async fn get_profile(&self, access_token: &str) -> Result<UserInfo, Status> {
        let client = reqwest::Client::new();
        let response = client
            .get("https://openidconnect.googleapis.com/v1/userinfo")
            .bearer_auth(access_token.to_owned())
            .send()
            .await
            .map_err(|e| Status::unauthenticated(format!("Unauthenticated: {}", e)))?;

        let user_info = response
            .json::<UserInfo>()
            .await
            .map_err(|e| Status::internal(format!("Failed to get profile: {}", e)))?;
        Ok(user_info)
    }
}

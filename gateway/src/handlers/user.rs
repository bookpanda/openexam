use crate::proto::auth::{GetGoogleLoginUrlRequest, LoginRequest, auth_client::AuthClient};
use crate::services::user::UserService;
use axum::extract::State;
use axum::{Json, extract::Path};
use hyper::StatusCode;
use tonic::transport::Channel;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

#[derive(Debug)]
pub struct UserHandler {
    user_client: AuthClient<Channel>,
}

impl UserHandler {
    pub fn new(user_client: AuthClient<Channel>) -> Self {
        Self { user_client }
    }

    pub async fn get_google_login_url(&self) -> anyhow::Result<String> {
        let request = GetGoogleLoginUrlRequest {};
        let response = self.user_client.get_google_login_url(request).await?;
        Ok(response.into_inner().url)
    }

    pub async fn login(&self, request: LoginRequest) -> anyhow::Result<String> {
        let request = LoginRequest { code: request.code };
        let response = self.user_client.login(request).await?;
        Ok(response.into_inner().message)
    }
}

use crate::proto::auth::{GetGoogleLoginUrlRequest, LoginRequest, auth_client::AuthClient};
use crate::services::user::UserService;
use axum::extract::State;
use axum::{Json, extract::Path};
use hyper::StatusCode;
use std::sync::Arc;
use tokio::sync::Mutex;
use tonic::transport::Channel;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

#[derive(Debug)]
pub struct UserHandler {
    user_service: UserService,
}

impl UserHandler {
    pub fn new(user_service: UserService) -> Self {
        Self { user_service }
    }

    pub async fn get_google_login_url(&self) -> (StatusCode, Json<String>) {
        self.user_service
            .get_google_login_url()
            .await
            .into_axum_response();
    }

    pub async fn login(&self, request: LoginRequest) -> (StatusCode, Json<String>) {
        let request = LoginRequest { code: request.code };
        let mut client = self.user_service.login(request).await?;
        let response = client.login(request).await;
        (StatusCode::OK, Json(response.into_inner().message))
    }
}

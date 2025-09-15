use std::sync::Arc;

use crate::dtos::user::LoginRequestDto;
use crate::services::response::ServiceResponse;
use crate::services::user::UserService;
use axum::Json;
use axum::extract::State;
use hyper::StatusCode;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct UserHandler {
    user_service: Arc<UserService>,
}

impl UserHandler {
    pub fn new(user_service: Arc<UserService>) -> Self {
        Self { user_service }
    }
}

pub async fn get_google_login_url(
    State(handler): State<UserHandler>,
) -> (StatusCode, Json<ServiceResponse<String>>) {
    handler
        .user_service
        .get_google_login_url()
        .await
        .into_axum_response()
}

pub async fn login(
    State(handler): State<UserHandler>,
    Json(request): Json<LoginRequestDto>,
) -> (StatusCode, Json<ServiceResponse<String>>) {
    handler
        .user_service
        .login(request)
        .await
        .into_axum_response()
}

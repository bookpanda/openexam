use crate::dtos;
use crate::services::user::UserService;
use axum::extract::State;
use axum::{Json, response::IntoResponse};

#[derive(Debug, Clone)]
pub struct UserHandler {
    user_service: UserService,
}

impl UserHandler {
    pub fn new(user_service: UserService) -> Self {
        Self { user_service }
    }
}

#[utoipa::path(
    get,
    path = "/api/user/google",
    tag = "User",
    responses(
        (status = 200, description = "Success", body = String),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn get_google_login_url(State(handler): State<UserHandler>) -> impl IntoResponse {
    handler
        .user_service
        .get_google_login_url()
        .await
        .into_axum_response()
}

#[utoipa::path(
    post,
    path = "/api/user/google/callback",
    tag = "User",
    request_body = dtos::LoginRequest,
    responses(
        (status = 200, description = "Success", body = dtos::LoginResponse),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn login(
    State(handler): State<UserHandler>,
    Json(request): Json<dtos::LoginRequest>,
) -> impl IntoResponse {
    handler
        .user_service
        .login(request)
        .await
        .into_axum_response()
}

#[utoipa::path(
    post,
    path = "/api/user/validate-token",
    tag = "User",
    request_body = dtos::ValidateTokenRequest,
    responses(
        (status = 200, description = "Success", body = dtos::ValidateTokenResponse),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn validate_token(
    State(handler): State<UserHandler>,
    Json(request): Json<dtos::ValidateTokenRequest>,
) -> impl IntoResponse {
    handler
        .user_service
        .validate_token(request)
        .await
        .into_axum_response()
}

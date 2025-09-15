use crate::dtos::user::LoginRequestDto;
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

    pub async fn get_google_login_url(State(handler): State<UserHandler>) -> impl IntoResponse {
        handler
            .user_service
            .get_google_login_url()
            .await
            .into_axum_response()
    }

    pub async fn login(
        State(handler): State<UserHandler>,
        Json(request): Json<LoginRequestDto>,
    ) -> impl IntoResponse {
        handler
            .user_service
            .login(request)
            .await
            .into_axum_response()
    }
}

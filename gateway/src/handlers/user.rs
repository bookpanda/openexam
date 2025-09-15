use crate::dtos::user::LoginRequestDto;
use crate::services::response::ServiceResponse;
use crate::services::user::UserService;
use axum::Json;
use hyper::StatusCode;

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

    pub async fn get_google_login_url(&self) -> (StatusCode, Json<ServiceResponse<String>>) {
        self.user_service
            .get_google_login_url()
            .await
            .into_axum_response()
    }

    pub async fn login(
        &self,
        Json(request): Json<LoginRequestDto>,
    ) -> (StatusCode, Json<ServiceResponse<String>>) {
        self.user_service.login(request).await.into_axum_response()
    }
}

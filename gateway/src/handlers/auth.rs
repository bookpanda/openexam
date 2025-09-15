use crate::proto::auth::{GetGoogleLoginUrlRequest, auth_client::AuthClient};
use crate::services::user::UserService;
use axum::extract::State;
use axum::{Json, extract::Path};
use hyper::StatusCode;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

#[derive(Debug)]
pub struct AuthHandler {
    auth_client: AuthClient,
}

impl AuthHandler {
    pub fn new(auth_client: AuthClient) -> Self {
        Self { auth_client }
    }

    pub async fn get_google_login_url(&self) -> anyhow::Result<String> {
        let request = GetGoogleLoginUrlRequest {};
        let response = self.auth_client.(request).await?;
        Ok(response.url)
    }
}

pub async fn get_all_users(
    State(pool): State<PgPool>,
) -> (StatusCode, Json<ServiceResponse<Vec<User>>>) {
    let response = UserService::get_all(&pool).await;

    response.into_axum_response()
}

pub async fn get_user(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    let response = UserService::get_one(&pool, id).await;

    response.into_axum_response()
}

pub async fn create_user(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    UserService::create(&pool, payload.name)
        .await
        .into_axum_response()
}

pub async fn update_user(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    UserService::update(&pool, id, payload.name)
        .await
        .into_axum_response()
}

pub async fn delete_user(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> (StatusCode, Json<ServiceResponse<String>>) {
    UserService::delete(&pool, id).await.into_axum_response()
}

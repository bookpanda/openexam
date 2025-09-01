use crate::services::user::UserService;
use crate::{models::user::User, services::response::ServiceResponse};
use axum::{Json, extract::Path};
use hyper::StatusCode;
use sqlx::PgPool;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

pub async fn get_user(
    Path(id): Path<i32>,
    pool: PgPool,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    let response = UserService::get_user(&pool, id).await;

    response.into_axum_response()
}

pub async fn create_user(
    Json(payload): Json<CreateUser>,
    pool: PgPool,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    UserService::create_user(&pool, payload.name)
        .await
        .into_axum_response()
}

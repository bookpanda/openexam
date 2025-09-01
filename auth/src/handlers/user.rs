use crate::services::user::UserService;
use crate::{models::user::User, services::response::ServiceResponse};
use axum::{Json, extract::Path};
use hyper::StatusCode;
use sqlx::PgPool;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

pub async fn get_all_users(pool: PgPool) -> (StatusCode, Json<ServiceResponse<Vec<User>>>) {
    let response = UserService::get_all(&pool).await;

    response.into_axum_response()
}

pub async fn get_user(
    Path(id): Path<i32>,
    pool: PgPool,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    let response = UserService::get_one(&pool, id).await;

    response.into_axum_response()
}

pub async fn create_user(
    Json(payload): Json<CreateUser>,
    pool: PgPool,
) -> (StatusCode, Json<ServiceResponse<User>>) {
    UserService::create(&pool, payload.name)
        .await
        .into_axum_response()
}

use crate::services::user::UserService;
use crate::{models::user::User, services::response::ServiceResponse};
use axum::extract::State;
use axum::{Json, extract::Path};
use hyper::StatusCode;
use sqlx::PgPool;

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
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

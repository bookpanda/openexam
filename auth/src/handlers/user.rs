use crate::models::user::User;
use crate::services::user::UserService;
use axum::{Json, extract::Path};
use sqlx::PgPool;

pub async fn get_user(Path(id): Path<i32>, pool: PgPool) -> Json<User> {
    let user = UserService::get_user(&pool, id).await.unwrap(); // handle errors properly in prod
    Json(user)
}

#[derive(serde::Deserialize)]
pub struct CreateUser {
    pub name: String,
}

pub async fn create_user(Json(payload): Json<CreateUser>, pool: PgPool) -> Json<User> {
    let user = UserService::create_user(&pool, payload.name).await.unwrap();
    Json(user)
}

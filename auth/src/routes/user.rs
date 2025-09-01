use crate::handlers::user::{create_user, get_all_users, get_user};
use axum::{
    Router,
    routing::{get, post},
};
use sqlx::PgPool;

pub fn user_routes() -> Router<PgPool> {
    Router::new()
        .route("/users", get(get_all_users))
        .route("/users/{id}", get(get_user))
        .route("/users", post(create_user))
}

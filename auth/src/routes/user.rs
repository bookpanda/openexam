use crate::handlers::user::{create_user, delete_user, get_all_users, get_user, update_user};
use axum::{
    Router,
    routing::{delete, get, post, put},
};
use sqlx::PgPool;

pub fn user_routes() -> Router<PgPool> {
    Router::new()
        .route("/users", get(get_all_users))
        .route("/users/{id}", get(get_user))
        .route("/users", post(create_user))
        .route("/users/{id}", put(update_user))
        .route("/users/{id}", delete(delete_user))
}

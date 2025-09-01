use crate::handlers::user::{create_user, get_user};
use axum::{
    Router,
    routing::{get, post},
};
use sqlx::PgPool;

pub fn user_routes(pool: PgPool) -> Router {
    let pool_clone = pool.clone();
    Router::new()
        .route("/users/{id}", get(move |path| get_user(path, pool)))
        .route(
            "/users",
            post(move |payload| create_user(payload, pool_clone)),
        )
}

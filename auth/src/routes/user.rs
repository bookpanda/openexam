use crate::handlers::user::{create_user, get_user};
use axum::Router;
use axum::routing::{get, post};
use sqlx::PgPool;

pub fn user_routes(pool: PgPool) -> Router {
    Router::new()
        .route(
            "/users/:id",
            get({
                let pool = pool.clone();
                move |id| get_user(id, pool.clone())
            }),
        )
        .route(
            "/users",
            post({
                let pool = pool.clone();
                move |payload| create_user(payload, pool.clone())
            }),
        )
}

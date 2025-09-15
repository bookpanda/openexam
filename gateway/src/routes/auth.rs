use crate::handlers;
use crate::handlers::user::UserHandler;
use axum::{
    Router,
    routing::{get, post},
};

pub fn auth_routes() -> Router<UserHandler> {
    Router::new()
        .route("/user/google", get(handlers::user::get_google_login_url))
        .route("/user/google/callback", post(handlers::user::login))
        .route("/user/validate-token", post(handlers::user::validate_token))
}

use crate::handlers::user::UserHandler;
use axum::{
    Router,
    routing::{get, post},
};

pub fn auth_routes() -> Router<UserHandler> {
    Router::new()
        .route("/user/google", get(UserHandler::get_google_login_url))
        .route("/user/google/callback", post(UserHandler::login))
}

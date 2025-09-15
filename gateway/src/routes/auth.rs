use std::sync::Arc;

use crate::handlers::user::UserHandler;
use axum::{
    Router,
    routing::{get, post},
};

pub fn auth_routes(user_handler: Arc<UserHandler>) -> Router {
    Router::new()
        .route("/user/google", get(UserHandler::get_google_login_url))
        .route("/user/google/callback", post(UserHandler::login))
}

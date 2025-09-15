use crate::handlers::user::UserHandler;
use crate::proto::auth::LoginRequest;
use axum::{
    Json, Router,
    routing::{get, post},
};

pub fn auth_routes(user_handler: UserHandler) -> Router {
    Router::new()
        .route("/user/google", get(user_handler.get_google_login_url))
        .route("/user/google/callback", post(user_handler.login))
}

use crate::handlers::user::{UserHandler, get_google_login_url, login};
use axum::{
    Router,
    routing::{get, post},
};

pub fn auth_routes() -> Router<UserHandler> {
    Router::new()
        .route("/user/google", get(get_google_login_url))
        .route("/user/google/callback", post(login))
}

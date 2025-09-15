use crate::handlers::auth::{get_google_login_url, login};
use axum::{
    Router,
    routing::{get, post},
};

pub fn auth_routes() -> Router {
    Router::new()
        .route("/auth/google", get(get_google_login_url))
        .route("/auth/google/callback", post(login))
}

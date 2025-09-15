use crate::handlers::user::UserHandler;
use crate::proto::auth::LoginRequest;
use axum::{
    Json, Router,
    routing::{get, post},
};

pub fn auth_routes(user_handler: UserHandler) -> Router {
    Router::new()
        .route("/user/google", get(user_handler.get_google_login_url))
        .route(
            "/user/google/callback",
            post(move |Json(payload): Json<LoginRequest>| async move {
                match user_handler.login(payload).await {
                    Ok(message) => Json(serde_json::json!({"message": message})),
                    Err(e) => Json(serde_json::json!({"error": e.to_string()})),
                }
            }),
        )
}

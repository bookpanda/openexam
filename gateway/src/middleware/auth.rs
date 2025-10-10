use axum::{
    body::Body,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use serde_json::json;

use crate::{
    dtos,
    services::{response::ApiResponse, user::UserService},
};

/// Middleware that validates JWT token from Authorization header
pub async fn auth_middleware(
    State(user_service): State<UserService>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, Response> {
    // Extract token from Authorization header
    let token = headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| {
            // Support both "Bearer TOKEN" and just "TOKEN"
            if v.starts_with("Bearer ") {
                Some(v.trim_start_matches("Bearer ").to_string())
            } else {
                Some(v.to_string())
            }
        });

    match token {
        Some(token) => {
            // Validate token with user service
            let validate_request = dtos::ValidateTokenRequest { token };
            let result = user_service.validate_token(validate_request).await;

            match result {
                ApiResponse::Success(user_data) => {
                    // Add user info to request headers for downstream handlers
                    request
                        .headers_mut()
                        .insert("X-User-Id", user_data.id.parse().unwrap());
                    request
                        .headers_mut()
                        .insert("X-User-Email", user_data.email.parse().unwrap());
                    request
                        .headers_mut()
                        .insert("X-User-Name", user_data.name.parse().unwrap());

                    Ok(next.run(request).await)
                }
                ApiResponse::Error { message, .. } => {
                    // Token validation failed
                    Err(unauthorized_response(&message))
                }
            }
        }
        None => {
            // No token provided
            Err(unauthorized_response("Missing authorization token"))
        }
    }
}

/// Helper function to create unauthorized response
fn unauthorized_response(message: &str) -> Response {
    let body = json!({
        "success": false,
        "error": message
    });

    Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .header("Content-Type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap()
}

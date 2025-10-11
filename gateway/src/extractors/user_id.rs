use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};

/// Extractor for user ID from X-User-Id header
pub struct UserId(pub String);

impl<S> FromRequestParts<S> for UserId
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let user_id = parts
            .headers
            .get("X-User-Id")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        if user_id.is_empty() {
            return Err((
                StatusCode::UNAUTHORIZED,
                "Missing or invalid X-User-Id header".to_string(),
            ));
        }

        Ok(UserId(user_id))
    }
}

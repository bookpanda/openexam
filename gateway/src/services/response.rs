use axum::Json;
use hyper::StatusCode;
use serde::Serialize;

#[derive(Serialize)]
#[serde(untagged)]
pub enum ApiResponse<T> {
    Success(T),
    Error { status: u16, message: String },
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        ApiResponse::Success(data)
    }

    pub fn created(data: T) -> Self {
        ApiResponse::Success(data)
    }

    pub fn not_found(msg: &str) -> Self {
        ApiResponse::Error {
            status: StatusCode::NOT_FOUND.as_u16(),
            message: msg.to_string(),
        }
    }

    pub fn internal_error(msg: &str) -> Self {
        ApiResponse::Error {
            status: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            message: msg.to_string(),
        }
    }

    pub fn into_axum_response(self) -> (StatusCode, Json<Self>) {
        let status = match &self {
            ApiResponse::Success(_) => StatusCode::OK,
            ApiResponse::Error { status, .. } => {
                StatusCode::from_u16(*status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
            }
        };
        (status, Json(self))
    }
}

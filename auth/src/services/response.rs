use axum::Json;
use hyper::StatusCode;
use serde::Serialize;

#[derive(Serialize)]
pub struct ServiceResponse<T> {
    pub status: u16,     // HTTP status code
    pub message: String, // human-readable message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>, // optional payload
}

impl<T> ServiceResponse<T> {
    pub fn ok(data: T) -> Self {
        ServiceResponse {
            status: 200,
            message: "OK".to_string(),
            data: Some(data),
        }
    }

    pub fn not_found(msg: &str) -> Self {
        ServiceResponse {
            status: 404,
            message: msg.to_string(),
            data: None,
        }
    }

    pub fn internal_error(msg: &str) -> Self {
        ServiceResponse {
            status: 500,
            message: msg.to_string(),
            data: None,
        }
    }

    pub fn into_axum_response(self) -> (StatusCode, Json<Self>) {
        let status = StatusCode::from_u16(self.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        (status, Json(self))
    }
}

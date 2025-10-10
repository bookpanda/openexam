use crate::dtos;
use crate::services::cheatsheet::CheatsheetService;
use axum::extract::{Query, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use serde::Deserialize;

#[derive(Debug, Clone)]
pub struct CheatsheetHandler {
    cheatsheet_service: CheatsheetService,
}

impl CheatsheetHandler {
    pub fn new(cheatsheet_service: CheatsheetService) -> Self {
        Self { cheatsheet_service }
    }
}

#[derive(Deserialize)]
pub struct PresignUploadQuery {
    pub filename: String,
}

#[utoipa::path(
    get,
    path = "/api/cheatsheet/files/presign/upload",
    tag = "Cheatsheet",
    params(
        ("filename" = String, Query, description = "Filename for the upload"),
    ),
    responses(
        (status = 200, description = "Success", body = dtos::GetPresignedUploadUrlResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn get_presigned_upload_url(
    State(handler): State<CheatsheetHandler>,
    Query(query): Query<PresignUploadQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    // Get user_id from header
    let user_id = headers
        .get("X-User-Id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    handler
        .cheatsheet_service
        .get_presigned_upload_url(query.filename, user_id)
        .await
        .into_axum_response()
}

#[derive(Deserialize)]
pub struct PresignGetQuery {
    pub key: String,
}

#[utoipa::path(
    get,
    path = "/api/cheatsheet/files/presign",
    tag = "Cheatsheet",
    params(
        ("key" = String, Query, description = "Full key in S3"),
    ),
    responses(
        (status = 200, description = "Success", body = dtos::GetPresignedGetUrlResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn get_presigned_get_url(
    State(handler): State<CheatsheetHandler>,
    Query(query): Query<PresignGetQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    // Get user_id from header
    let user_id = headers
        .get("X-User-Id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    handler
        .cheatsheet_service
        .get_presigned_get_url(query.key, user_id)
        .await
        .into_axum_response()
}

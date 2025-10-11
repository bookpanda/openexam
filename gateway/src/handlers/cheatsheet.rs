use crate::dtos::{self, PresignGetQuery, PresignUploadQuery, RemoveFileQuery};
use crate::extractors::UserId;
use crate::services::cheatsheet::CheatsheetService;
use axum::Json;
use axum::extract::{Query, State};
use axum::response::IntoResponse;

#[derive(Debug, Clone)]
pub struct CheatsheetHandler {
    cheatsheet_service: CheatsheetService,
}

impl CheatsheetHandler {
    pub fn new(cheatsheet_service: CheatsheetService) -> Self {
        Self { cheatsheet_service }
    }
}

#[utoipa::path(
    get,
    path = "/api/cheatsheet/presigned/upload",
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
    UserId(user_id): UserId,
    Query(query): Query<PresignUploadQuery>,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .get_presigned_upload_url(query.filename, user_id)
        .await
        .into_axum_response()
}

#[utoipa::path(
    get,
    path = "/api/cheatsheet/presigned",
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
    UserId(user_id): UserId,
    Query(query): Query<PresignGetQuery>,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .get_presigned_get_url(query.key, user_id)
        .await
        .into_axum_response()
}

#[utoipa::path(
    delete,
    path = "/api/cheatsheet/files",
    tag = "Cheatsheet",
    params(
        ("file_type" = String, Query, description = "File type (slide or cheatsheet)"),
        ("file" = String, Query, description = "Filename to delete"),
    ),
    responses(
        (status = 200, description = "File deleted successfully"),
        (status = 404, description = "File not found"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn remove(
    State(handler): State<CheatsheetHandler>,
    UserId(user_id): UserId,
    Query(query): Query<RemoveFileQuery>,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .remove_file(query.file_type.to_string(), query.file, user_id)
        .await
        .into_axum_response()
}

#[utoipa::path(
    get,
    path = "/api/cheatsheet/files",
    tag = "Cheatsheet",
    responses(
        (status = 200, description = "List of all user files", body = dtos::GetAllFilesResponse),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn get_all_files(
    State(handler): State<CheatsheetHandler>,
    UserId(user_id): UserId,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .get_all_files(user_id)
        .await
        .into_axum_response()
}

#[utoipa::path(
    post,
    path = "/api/cheatsheet/share",
    tag = "Cheatsheet",
    request_body = dtos::ShareRequest,
    responses(
        (status = 200, description = "File shared successfully", body = dtos::ShareResponse),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn share(
    State(handler): State<CheatsheetHandler>,
    UserId(owner_id): UserId,
    Json(body): Json<dtos::ShareRequest>,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .share(owner_id, body.user_id, body.file_id)
        .await
        .into_axum_response()
}

#[utoipa::path(
    post,
    path = "/api/cheatsheet/unshare",
    tag = "Cheatsheet",
    request_body = dtos::UnshareRequest,
    responses(
        (status = 200, description = "File unshared successfully", body = dtos::UnshareResponse),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn unshare(
    State(handler): State<CheatsheetHandler>,
    UserId(owner_id): UserId,
    Json(body): Json<dtos::UnshareRequest>,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .unshare(owner_id, body.user_id, body.file_id)
        .await
        .into_axum_response()
}

#[utoipa::path(
    post,
    path = "/api/cheatsheet/generate",
    tag = "Cheatsheet",
    request_body = dtos::GenerateRequest,
    responses(
        (status = 200, description = "Generation request accepted", body = dtos::GenerateResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn generate(
    State(handler): State<CheatsheetHandler>,
    UserId(user_id): UserId,
    Json(body): Json<dtos::GenerateRequest>,
) -> impl IntoResponse {
    handler
        .cheatsheet_service
        .generate(body.file_ids, user_id)
        .await
        .into_axum_response()
}

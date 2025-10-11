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
    description = "Generate a presigned URL for uploading a file to S3. The URL expires after a set time.",
    params(
        ("filename" = String, Query, description = "Filename for the upload e.g. slide1.pdf"),
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
    description = "Generate a presigned URL for downloading a file from S3. The URL expires after a set time.",
    params(
        ("key" = String, Query, description = "Full key in S3 e.g. slides/1/4e8d92_test.pdf"),
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
    description = "Delete a file from S3 and remove all associated shares from DynamoDB.",
    params(
        ("file_type" = String, Query, description = "File type (`slides` or `cheatsheets`)"),
        ("file" = String, Query, description = "Filename to delete e.g. 82a354_test.pdf"),
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
    description = "Get all files that are shared with the current user, including files they own.",
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
    description = "Share your file with another user. Creates a share record in DynamoDB. Your user id is determined from the Auth header.",
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
    description = "Revoke a user's access to a file. Removes the share record from DynamoDB. Your user id is determined from the Auth header.",
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
    description = "Generate a combined PDF from multiple files you have access to. Sends a request to SQS and waits for the Lambda to process and merge the PDFs. Returns the key of the generated file.",
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

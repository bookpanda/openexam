use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, ToSchema)]
pub struct GetPresignedUploadUrlRequest {
    pub filename: String,
    pub user_id: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct GetPresignedUploadUrlResponse {
    pub expires_in: String,
    pub url: String,
}

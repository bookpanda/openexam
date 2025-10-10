use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, ToSchema)]
pub struct GetPresignedUploadUrlResponse {
    pub expires_in: String,
    pub url: String,
    pub key: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct GetPresignedGetUrlResponse {
    pub expires_in: String,
    pub url: String,
}

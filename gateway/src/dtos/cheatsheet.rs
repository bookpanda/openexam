use core::fmt;

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

#[derive(Deserialize)]
pub struct PresignUploadQuery {
    pub filename: String,
}

#[derive(Deserialize)]
pub struct PresignGetQuery {
    pub key: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum FileType {
    Slides,
    Cheatsheets,
}

// Implement Display to get to_string()
impl fmt::Display for FileType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FileType::Slides => write!(f, "slides"),
            FileType::Cheatsheets => write!(f, "cheatsheets"),
        }
    }
}

#[derive(Deserialize)]
pub struct RemoveFileQuery {
    pub file_type: FileType,
    pub file: String,
}

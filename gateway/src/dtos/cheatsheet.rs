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

#[derive(Deserialize, ToSchema)]
pub struct PresignUploadQuery {
    pub filename: String,
}

#[derive(Deserialize, ToSchema)]
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

#[derive(Deserialize, ToSchema)]
pub struct RemoveFileQuery {
    pub file_type: FileType,
    pub file: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct File {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    pub name: String,
    pub key: String,
}

#[derive(Deserialize)]
pub struct GetAllFilesResponse {
    pub files: Vec<File>,
}

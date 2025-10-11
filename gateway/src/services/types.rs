use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ServiceResponse<T> {
    pub data: T,
    // pub success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmptyResponse {}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
pub struct GetPresignedUploadUrlData {
    pub expiresIn: u64,
    pub url: String,
    pub key: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
pub struct GetPresignedGetUrlData {
    pub expiresIn: u64,
    pub url: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
pub struct File {
    pub ID: String,
    pub UserID: String,
    pub CreatedAt: String,
    pub Name: String,
    pub Key: String,
}

#[derive(Debug, Deserialize)]
pub struct FilesData {
    pub files: Vec<File>,
}

#[derive(Debug, Deserialize)]
pub struct ShareData {
    pub shared: bool,
}

#[derive(Debug, Deserialize)]
pub struct UnshareData {
    pub unshared: bool,
}

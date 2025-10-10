use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ServiceResponse<T> {
    pub data: T,
    pub success: bool,
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

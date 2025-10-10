use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ServiceResponse<T> {
    pub data: T,
    pub success: bool,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
pub struct GetPresignedUploadUrlData {
    pub expiresIn: u64,
    pub url: String,
}

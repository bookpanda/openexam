use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    data: T,
    success: bool,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
struct GetPresignedUploadUrlData {
    expiresIn: u64,
    url: String,
}

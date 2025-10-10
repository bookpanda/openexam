use log::error;
use serde::Deserialize;

use crate::{dtos, services::response::ApiResponse};

#[derive(Deserialize)]
struct PresignResponse {
    success: bool,
    data: PresignData,
}

#[derive(Deserialize)]
struct PresignData {
    url: String,
    key: String,
    #[serde(rename = "expiresIn")]
    expires_in: i32,
}

#[derive(Debug, Clone)]
pub struct CheatsheetService {}

impl CheatsheetService {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn get_presigned_upload_url(
        &self,
        filename: String,
        user_id: String,
    ) -> ApiResponse<dtos::GetPresignedUploadUrlResponse> {
        let url = format!(
            "http://localhost:3000/files/presign?filename={}",
            urlencoding::encode(&filename)
        );

        match reqwest::Client::new()
            .get(&url)
            .header("X-User-Id", user_id)
            .send()
            .await
        {
            Ok(response) => match response.json::<PresignResponse>().await {
                Ok(data) => {
                    let result = dtos::GetPresignedUploadUrlResponse {
                        url: data.data.url,
                        expires_in: data.data.expires_in.to_string(),
                    };
                    ApiResponse::ok(result)
                }
                Err(e) => {
                    error!("Failed to parse presigned upload url response: {:?}", e);
                    ApiResponse::internal_error(&format!(
                        "Failed to parse presigned upload url response: {:?}",
                        e
                    ))
                }
            },
            Err(e) => {
                error!("Get presigned upload url error: {:?}", e);
                ApiResponse::internal_error(&format!("Get presigned upload url error: {:?}", e))
            }
        }
    }
}

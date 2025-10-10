use log::error;

use crate::{
    dtos,
    services::{response::ApiResponse, types},
};

#[derive(Debug, Clone)]
pub struct CheatsheetService {
    cheatsheet_api_url: String,
}

impl CheatsheetService {
    pub fn new(cheatsheet_api_url: String) -> Self {
        Self { cheatsheet_api_url }
    }

    pub async fn get_presigned_upload_url(
        &self,
        filename: String,
        user_id: String,
    ) -> ApiResponse<dtos::GetPresignedUploadUrlResponse> {
        let url = format!(
            "{}/files/presign/upload?filename={}",
            self.cheatsheet_api_url,
            urlencoding::encode(&filename)
        );

        match reqwest::Client::new()
            .get(&url)
            .header("X-User-Id", user_id)
            .send()
            .await
        {
            Ok(response) => match response
                .json::<types::ServiceResponse<types::GetPresignedUploadUrlData>>()
                .await
            {
                Ok(data) => {
                    let result = dtos::GetPresignedUploadUrlResponse {
                        url: data.data.url,
                        expires_in: data.data.expiresIn.to_string(),
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

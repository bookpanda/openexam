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
                        expires_in: data.data.expiresIn.to_string(),
                        url: data.data.url,
                        key: data.data.key,
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

    pub async fn get_presigned_get_url(
        &self,
        key: String,
        user_id: String,
    ) -> ApiResponse<dtos::GetPresignedGetUrlResponse> {
        let url = format!(
            "{}/files/presign?key={}",
            self.cheatsheet_api_url,
            urlencoding::encode(&key)
        );

        match reqwest::Client::new()
            .get(&url)
            .header("X-User-Id", user_id)
            .send()
            .await
        {
            Ok(response) => match response
                .json::<types::ServiceResponse<types::GetPresignedGetUrlData>>()
                .await
            {
                Ok(data) => {
                    let result = dtos::GetPresignedGetUrlResponse {
                        expires_in: data.data.expiresIn.to_string(),
                        url: data.data.url,
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

    pub async fn remove_file(
        &self,
        file_type: String,
        file: String,
        user_id: String,
    ) -> ApiResponse<types::EmptyResponse> {
        let url = format!("{}/files", self.cheatsheet_api_url);

        match reqwest::Client::new()
            .delete(&url)
            .header("X-User-Id", user_id.to_string())
            .query(&[
                ("file_type", file_type),
                ("user_id", user_id),
                ("file", file),
            ])
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    ApiResponse::ok(types::EmptyResponse {})
                } else {
                    let status = response.status();
                    error!("Failed to delete file: status {}", status);
                    ApiResponse::internal_error(&format!(
                        "Failed to delete file: status {}",
                        status
                    ))
                }
            }
            Err(e) => {
                error!("Delete file error: {:?}", e);
                ApiResponse::internal_error(&format!("Delete file error: {:?}", e))
            }
        }
    }

    pub async fn get_all_files(&self, user_id: String) -> ApiResponse<Vec<dtos::File>> {
        let url = format!("{}/files", self.cheatsheet_api_url);

        match reqwest::Client::new()
            .get(&url)
            .header("X-User-Id", user_id)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    match response
                        .json::<types::ServiceResponse<types::FilesData>>()
                        .await
                    {
                        Ok(response_data) => ApiResponse::ok(
                            response_data
                                .data
                                .files
                                .into_iter()
                                .map(|f| dtos::File {
                                    id: f.ID,
                                    user_id: f.UserID,
                                    created_at: f.CreatedAt,
                                    name: f.Name,
                                    key: f.Key,
                                })
                                .collect(),
                        ),
                        Err(e) => {
                            error!("Failed to parse files response: {:?}", e);
                            ApiResponse::internal_error(&format!(
                                "Failed to parse response: {:?}",
                                e
                            ))
                        }
                    }
                } else {
                    let status = response.status();
                    error!("Failed to get files: status {}", status);
                    ApiResponse::internal_error(&format!("Failed to get files: status {}", status))
                }
            }
            Err(e) => {
                error!("Get files error: {:?}", e);
                ApiResponse::internal_error(&format!("Get files error: {:?}", e))
            }
        }
    }
}

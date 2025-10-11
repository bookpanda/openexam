use log::error;

use crate::{
    dtos,
    services::{response::ApiResponse, types},
};

#[derive(Debug, Clone)]
pub struct CheatsheetService {
    cheatsheet_api_url: String,
    client: reqwest::Client,
}

impl CheatsheetService {
    pub fn new(cheatsheet_api_url: String) -> Self {
        Self {
            cheatsheet_api_url,
            client: reqwest::Client::new(),
        }
    }

    async fn send_request(
        &self,
        request: reqwest::RequestBuilder,
    ) -> Result<reqwest::Response, String> {
        request.send().await.map_err(|e| {
            error!("HTTP request error: {:?}", e);
            format!("Request failed: {:?}", e)
        })
    }

    async fn parse_json<T: serde::de::DeserializeOwned>(
        &self,
        response: reqwest::Response,
    ) -> Result<T, String> {
        if !response.status().is_success() {
            let status = response.status();
            error!("Request failed with status: {}", status);
            return Err(format!("Request failed with status: {}", status));
        }

        response.json::<T>().await.map_err(|e| {
            error!("Failed to parse response: {:?}", e);
            format!("Failed to parse response: {:?}", e)
        })
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

        let request = self.client.get(&url).header("X-User-Id", user_id);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::GetPresignedUploadUrlData> =
            match self.parse_json(response).await {
                Ok(d) => d,
                Err(e) => return ApiResponse::internal_error(&e),
            };

        let result = dtos::GetPresignedUploadUrlResponse {
            expires_in: data.data.expiresIn.to_string(),
            url: data.data.url,
            key: data.data.key,
        };
        ApiResponse::ok(result)
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

        let request = self.client.get(&url).header("X-User-Id", user_id);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::GetPresignedGetUrlData> =
            match self.parse_json(response).await {
                Ok(d) => d,
                Err(e) => return ApiResponse::internal_error(&e),
            };

        let result = dtos::GetPresignedGetUrlResponse {
            expires_in: data.data.expiresIn.to_string(),
            url: data.data.url,
        };
        ApiResponse::ok(result)
    }

    pub async fn remove_file(
        &self,
        file_type: String,
        file: String,
        user_id: String,
    ) -> ApiResponse<types::EmptyResponse> {
        let url = format!("{}/files", self.cheatsheet_api_url);

        let request = self
            .client
            .delete(&url)
            .header("X-User-Id", &user_id)
            .query(&[
                ("file_type", file_type),
                ("user_id", user_id),
                ("file", file),
            ]);

        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        if !response.status().is_success() {
            let status = response.status();
            error!("Failed to delete file: status {}", status);
            return ApiResponse::internal_error(&format!(
                "Failed to delete file: status {}",
                status
            ));
        }

        ApiResponse::ok(types::EmptyResponse {})
    }

    pub async fn get_all_files(&self, user_id: String) -> ApiResponse<Vec<dtos::File>> {
        let url = format!("{}/files", self.cheatsheet_api_url);

        let request = self.client.get(&url).header("X-User-Id", user_id);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::FilesData> = match self.parse_json(response).await {
            Ok(d) => d,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let files = data
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
            .collect();

        ApiResponse::ok(files)
    }

    pub async fn share(
        &self,
        owner_id: String,
        user_id: String,
        file_id: String,
    ) -> ApiResponse<dtos::ShareResponse> {
        let url = format!("{}/share", self.cheatsheet_api_url);

        let request = self
            .client
            .post(&url)
            .header("X-User-Id", owner_id)
            .form(&[("user_id", user_id), ("file_id", file_id)]);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::ShareData> = match self.parse_json(response).await {
            Ok(d) => d,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        ApiResponse::ok(dtos::ShareResponse {
            shared: data.data.shared,
        })
    }

    pub async fn unshare(
        &self,
        owner_id: String,
        user_id: String,
        file_id: String,
    ) -> ApiResponse<dtos::UnshareResponse> {
        let url = format!("{}/unshare", self.cheatsheet_api_url);

        let request = self
            .client
            .post(&url)
            .header("X-User-Id", owner_id)
            .query(&[("user_id", user_id), ("file_id", file_id)]);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::UnshareData> = match self.parse_json(response).await
        {
            Ok(d) => d,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        ApiResponse::ok(dtos::UnshareResponse {
            unshared: data.data.unshared,
        })
    }
}

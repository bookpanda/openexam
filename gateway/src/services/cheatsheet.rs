use std::collections::HashMap;

use log::error;

use crate::{
    dtos,
    services::{response::ApiResponse, types, user::UserService},
};

#[derive(Debug, Clone)]
pub struct CheatsheetService {
    cheatsheet_api_url: String,
    client: reqwest::Client,
    user_service: UserService,
}

impl CheatsheetService {
    pub fn new(cheatsheet_api_url: String, user_service: UserService) -> Self {
        Self {
            cheatsheet_api_url,
            client: reqwest::Client::new(),
            user_service,
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
    ) -> Result<T, (u16, String)> {
        let status_code = response.status().as_u16();

        if !response.status().is_success() {
            // Try to get error message from response body
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            error!("Request failed with status {}: {}", status_code, error_body);
            return Err((status_code, error_body));
        }

        response.json::<T>().await.map_err(|e| {
            error!("Failed to parse response: {:?}", e);
            (status_code, format!("Failed to parse response: {:?}", e))
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
                Err((status, msg)) => return ApiResponse::error(status, &msg),
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
                Err((status, msg)) => return ApiResponse::error(status, &msg),
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

    pub async fn get_all_files(&self, user_id: String) -> ApiResponse<dtos::GetAllFilesResponse> {
        let url = format!("{}/files", self.cheatsheet_api_url);

        let request = self.client.get(&url).header("X-User-Id", user_id);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::FilesData> = match self.parse_json(response).await {
            Ok(d) => d,
            Err((status, msg)) => return ApiResponse::error(status, &msg),
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

        ApiResponse::ok(dtos::GetAllFilesResponse { files })
    }

    pub async fn get_file(
        &self,
        user_id: String,
        file_id: String,
    ) -> ApiResponse<dtos::GetFileResponse> {
        let url = format!("{}/files/{}", self.cheatsheet_api_url, file_id);

        let request = self.client.get(&url).header("X-User-Id", user_id);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<types::FileData> = match self.parse_json(response).await {
            Ok(d) => d,
            Err((status, msg)) => return ApiResponse::error(status, &msg),
        };

        let file = dtos::File {
            id: data.data.file.ID,
            user_id: data.data.file.UserID,
            created_at: data.data.file.CreatedAt,
            name: data.data.file.Name,
            key: data.data.file.Key,
        };

        let users = match self.user_service.get_all_users().await {
            ApiResponse::Success(u) => u.users,
            ApiResponse::Error { status, message } => return ApiResponse::error(status, &message),
        };
        let user_id_to_name = users
            .iter()
            .map(|u| (u.id.clone(), u.name.clone()))
            .collect::<HashMap<String, String>>();

        let shares = data
            .data
            .shares
            .into_iter()
            .map(|f| dtos::Share {
                user_id: f.UserID.clone(),
                name: user_id_to_name
                    .get(&f.UserID.clone())
                    .unwrap_or(&"".to_string())
                    .clone(),
            })
            .collect();

        ApiResponse::ok(dtos::GetFileResponse { file, shares })
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
            Err((status, msg)) => return ApiResponse::error(status, &msg),
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
            Err((status, msg)) => return ApiResponse::error(status, &msg),
        };

        ApiResponse::ok(dtos::UnshareResponse {
            unshared: data.data.unshared,
        })
    }

    pub async fn generate(
        &self,
        file_ids: Vec<String>,
        user_id: String,
    ) -> ApiResponse<dtos::GenerateResponse> {
        let url = format!("{}/generate", self.cheatsheet_api_url);

        let body = serde_json::json!({
            "file_ids": file_ids,
        });

        let request = self
            .client
            .post(&url)
            .json(&body)
            .header("X-User-Id", user_id);
        let response = match self.send_request(request).await {
            Ok(r) => r,
            Err(e) => return ApiResponse::internal_error(&e),
        };

        let data: types::ServiceResponse<dtos::GenerateResponse> =
            match self.parse_json(response).await {
                Ok(d) => d,
                Err((status, msg)) => return ApiResponse::error(status, &msg),
            };

        ApiResponse::ok(data.data)
    }
}

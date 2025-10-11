use log::error;
use std::sync::Arc;
use tonic::transport::Channel;

use crate::dtos;
use crate::proto::user::{GetAllUsersRequest, ValidateTokenRequest};
use crate::{
    proto::user::{GetGoogleLoginUrlRequest, LoginRequest, user_client::UserClient},
    services::response::ApiResponse,
};

#[derive(Debug, Clone)]
pub struct UserService {
    user_client: Arc<UserClient<Channel>>,
}

impl UserService {
    pub fn new(user_client: UserClient<Channel>) -> Self {
        Self {
            user_client: Arc::new(user_client),
        }
    }

    pub async fn get_google_login_url(&self) -> ApiResponse<String> {
        let mut client = (*self.user_client).clone();
        let request = GetGoogleLoginUrlRequest {};

        match client.get_google_login_url(request).await {
            Ok(response) => ApiResponse::ok(response.into_inner().url),
            Err(e) => {
                error!("Get google login url error: {:?}", e);
                ApiResponse::internal_error(&format!("Get google login url error: {:?}", e))
            }
        }
    }
    pub async fn login(&self, request: dtos::LoginRequest) -> ApiResponse<dtos::LoginResponse> {
        let mut client = (*self.user_client).clone();
        let request = LoginRequest { code: request.code };

        match client.login(request).await {
            Ok(response) => {
                let response = response.into_inner();
                ApiResponse::ok(dtos::LoginResponse {
                    id: response.id,
                    email: response.email,
                    name: response.name,
                    token: response.token,
                })
            }
            Err(e) => {
                error!("Login error: {:?}", e);
                ApiResponse::internal_error(&format!("Login error: {:?}", e))
            }
        }
    }

    pub async fn validate_token(
        &self,
        request: dtos::ValidateTokenRequest,
    ) -> ApiResponse<dtos::ValidateTokenResponse> {
        let mut client = (*self.user_client).clone();
        let request = ValidateTokenRequest {
            token: request.token,
        };

        match client.validate_token(request).await {
            Ok(response) => {
                let response = response.into_inner();
                ApiResponse::ok(dtos::ValidateTokenResponse {
                    id: response.id,
                    email: response.email,
                    name: response.name,
                })
            }
            Err(e) => {
                error!("Validate token error: {:?}", e);
                ApiResponse::internal_error(&format!("Validate token error: {:?}", e))
            }
        }
    }

    pub async fn get_all_users(&self) -> ApiResponse<dtos::GetAllUsersResponse> {
        let mut client = (*self.user_client).clone();
        let request = GetAllUsersRequest {};

        match client.get_all_users(request).await {
            Ok(response) => ApiResponse::ok(dtos::GetAllUsersResponse {
                users: response
                    .into_inner()
                    .users
                    .into_iter()
                    .map(|user| dtos::UserProfile {
                        id: user.id,
                        name: user.name,
                    })
                    .collect(),
            }),
            Err(e) => {
                error!("Get all users error: {:?}", e);
                ApiResponse::internal_error(&format!("Get all users error: {:?}", e))
            }
        }
    }
}

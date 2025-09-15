use log::error;
use std::sync::Arc;
use tonic::transport::Channel;

use crate::dtos;
use crate::proto::user::ValidateTokenRequest;
use crate::{
    proto::user::{GetGoogleLoginUrlRequest, LoginRequest, user_client::UserClient},
    services::response::ServiceResponse,
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

    pub async fn get_google_login_url(&self) -> ServiceResponse<String> {
        let mut client = (*self.user_client).clone();
        let request = GetGoogleLoginUrlRequest {};

        match client.get_google_login_url(request).await {
            Ok(response) => ServiceResponse::ok(response.into_inner().url),
            Err(e) => {
                error!("Get google login url error: {:?}", e);
                ServiceResponse::internal_error(&format!("Get google login url error: {:?}", e))
            }
        }
    }
    pub async fn login(
        &self,
        request: dtos::LoginRequestDto,
    ) -> ServiceResponse<dtos::LoginResponseDto> {
        let mut client = (*self.user_client).clone();
        let request = LoginRequest { code: request.code };

        match client.login(request).await {
            Ok(response) => {
                let response = response.into_inner();
                ServiceResponse::ok(dtos::LoginResponseDto {
                    id: response.id,
                    email: response.email,
                    name: response.name,
                    token: response.token,
                })
            }
            Err(e) => {
                error!("Login error: {:?}", e);
                ServiceResponse::internal_error(&format!("Login error: {:?}", e))
            }
        }
    }

    pub async fn validate_token(
        &self,
        request: dtos::ValidateTokenRequestDto,
    ) -> ServiceResponse<dtos::ValidateTokenResponseDto> {
        let mut client = (*self.user_client).clone();
        let request = ValidateTokenRequest {
            token: request.token,
        };

        match client.validate_token(request).await {
            Ok(response) => {
                let response = response.into_inner();
                ServiceResponse::ok(dtos::ValidateTokenResponseDto {
                    id: response.id,
                    email: response.email,
                    name: response.name,
                })
            }
            Err(e) => {
                error!("Validate token error: {:?}", e);
                ServiceResponse::internal_error(&format!("Validate token error: {:?}", e))
            }
        }
    }
}

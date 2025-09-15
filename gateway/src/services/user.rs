use tonic::transport::Channel;

use crate::{
    dtos::user::LoginRequestDto,
    proto::auth::{GetGoogleLoginUrlRequest, LoginRequest, auth_client::AuthClient},
    services::response::ServiceResponse,
};

#[derive(Debug)]
pub struct UserService {
    user_client: AuthClient<Channel>,
}

impl UserService {
    pub fn new(user_client: AuthClient<Channel>) -> Self {
        Self {
            user_client: user_client,
        }
    }

    pub async fn get_google_login_url(&self) -> ServiceResponse<String> {
        let mut client = self.user_client.clone();
        let request = GetGoogleLoginUrlRequest {};

        match client.get_google_login_url(request).await {
            Ok(response) => ServiceResponse::ok(response.into_inner().url),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
    pub async fn login(&self, request: LoginRequestDto) -> ServiceResponse<String> {
        let mut client = self.user_client.clone();
        let request = LoginRequest { code: request.code };

        match client.login(request).await {
            Ok(response) => ServiceResponse::ok(response.into_inner().message),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
}

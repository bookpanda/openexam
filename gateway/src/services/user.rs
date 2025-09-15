use tonic::transport::Channel;

use crate::{
    proto::auth::{GetGoogleLoginUrlRequest, LoginRequest, auth_client::AuthClient},
    services::response::ServiceResponse,
};

#[derive(Debug)]
pub struct UserService {
    user_client: AuthClient<Channel>,
}

impl UserService {
    pub fn new(user_client: AuthClient<Channel>) -> Self {
        Self { user_client }
    }

    pub async fn get_google_login_url(&self) -> ServiceResponse<String> {
        let request = GetGoogleLoginUrlRequest {};
        match self.user_client.get_google_login_url(request).await {
            Ok(response) => ServiceResponse::ok(response.into_inner().url),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
    pub async fn login(&self, request: LoginRequest) -> ServiceResponse<String> {
        match self.user_client.login(request).await {
            Ok(response) => ServiceResponse::ok(response.into_inner().message),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
}

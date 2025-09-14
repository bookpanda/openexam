use tonic::{Request, Response, Status};

use crate::proto::auth::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest,
};
use crate::services::oauth::OAuthService;
use crate::services::user::UserService;

#[derive(Debug)]
pub struct AuthService {
    user_service: UserService,
    oauth_service: OAuthService,
}

impl AuthService {
    pub fn new(user_service: UserService, oauth_service: OAuthService) -> anyhow::Result<Self> {
        Ok(Self {
            user_service,
            oauth_service,
        })
    }

    pub fn get_google_login_url(
        &self,
        request: Request<GetGoogleLoginUrlRequest>,
    ) -> Result<Response<GetGoogleLoginUrlReply>, Status> {
        let auth_url = self.oauth_service.get_google_login_url();
        Ok(Response::new(GetGoogleLoginUrlReply {
            url: auth_url.to_string(),
        }))
    }

    pub async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<LoginReply>, Status> {
        let code = request.into_inner().code;
        let access_token = self
            .oauth_service
            .get_access_token(code)
            .await
            .map_err(|e| Status::internal(format!("Failed to get access token: {}", e)))?;

        let user_info = self
            .oauth_service
            .get_profile(&access_token)
            .await
            .map_err(|e| Status::internal(format!("Failed to get profile: {}", e)))?;

        let user = self.user_service.find_by_email(user_info.email).await?;

        Ok(Response::new(LoginReply {
            message: format!("Hello, {}!", user_info.name),
        }))
    }
}

use tonic::{Request, Response, Status};

use crate::proto::auth::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest,
};
use crate::repositories::user::UserRepo;
use crate::services::oauth::OAuthService;

#[derive(Debug)]
pub struct AuthService {
    pub user_repo: UserRepo,
    oauth_service: OAuthService,
}

impl AuthService {
    pub fn new(user_repo: UserRepo, oauth_service: OAuthService) -> anyhow::Result<Self> {
        Ok(Self {
            user_repo,
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
            .map_err(|e| Status::internal(format!("Failed to exchange code: {}", e)))?;

        let user_info = self
            .oauth_service
            .get_profile(&access_token)
            .await
            .map_err(|e| Status::internal(format!("Failed to get profile: {}", e)))?;

        Ok(Response::new(LoginReply {
            message: format!("Hello, {}!", user_info.name),
        }))
    }
}

use tonic::{Request, Response, Status};

use crate::models::user::User;
use crate::proto::user::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest,
};
use crate::services::oauth::OAuthService;
use crate::services::user::UserService;
use log::error;

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
        _: Request<GetGoogleLoginUrlRequest>,
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
        let access_token = self.oauth_service.get_access_token(code).await?;
        let user_info = self.oauth_service.get_profile(&access_token).await?;
        dbg!(&user_info);

        let user = match self.user_service.find_by_email(&user_info.email).await {
            Ok(Some(user)) => user,
            Ok(None) => {
                let new_user = User {
                    id: 0,
                    email: user_info.email,
                    name: user_info.name,
                };
                self.user_service.create(&new_user).await?
            }
            Err(e) => {
                error!("Failed to find user by email: {:?}", e);
                return Err(Status::internal("Database error"));
            }
        };

        Ok(Response::new(LoginReply {
            id: user.id.to_string(),
            email: user.email,
            name: user.name,
            token: access_token,
        }))
    }
}

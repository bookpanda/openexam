use tonic::{Request, Response, Status};

use crate::models::user::User;
use crate::proto::user::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest, ValidateTokenReply,
    ValidateTokenRequest,
};
use crate::services::oauth::OAuthService;
use crate::services::user::UserService;
use log::error;
use std::sync::Arc;

#[derive(Debug)]
pub struct AuthService {
    user_service: Arc<UserService>,
    oauth_service: OAuthService,
}

impl AuthService {
    pub fn new(
        user_service: Arc<UserService>,
        oauth_service: OAuthService,
    ) -> anyhow::Result<Self> {
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
        let access_token = self.oauth_service.get_access_token(&code).await?;
        let user_info = self.oauth_service.get_profile(&access_token).await?;

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

    pub async fn validate_token(
        &self,
        request: Request<ValidateTokenRequest>,
    ) -> Result<Response<ValidateTokenReply>, Status> {
        let token = request.into_inner().token;
        let user = self.oauth_service.get_profile(&token).await?;

        let existing_user = match self.user_service.find_by_email(&user.email).await {
            Ok(Some(user)) => user,
            Ok(None) => {
                return Err(Status::not_found("User not found"));
            }
            Err(e) => {
                error!("Failed to find user by email: {:?}", e);
                return Err(Status::internal("Failed to find user by email"));
            }
        };

        if existing_user.email != user.email {
            error!(
                "Invalid token: expected email {} but got {}",
                existing_user.email, user.email
            );
            return Err(Status::unauthenticated("Invalid token"));
        }

        Ok(Response::new(ValidateTokenReply {
            id: existing_user.id.to_string(),
            email: existing_user.email,
            name: existing_user.name,
        }))
    }
}

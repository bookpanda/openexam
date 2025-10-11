use crate::proto::user::user_server::{User, UserServer};
use crate::proto::user::{
    GetAllUsersReply, GetAllUsersRequest, GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest,
    LoginReply, LoginRequest, ValidateTokenReply, ValidateTokenRequest,
};
use crate::services::auth::AuthService;
use crate::services::user::UserService;
use std::sync::Arc;
use tonic::{Request, Response, Status};

#[derive(Debug)]
pub struct MyUser {
    pub auth_service: AuthService,
    pub user_service: Arc<UserService>,
}

#[tonic::async_trait]
impl User for MyUser {
    async fn get_google_login_url(
        &self,
        request: Request<GetGoogleLoginUrlRequest>,
    ) -> Result<Response<GetGoogleLoginUrlReply>, Status> {
        self.auth_service.get_google_login_url(request)
    }

    async fn login(&self, request: Request<LoginRequest>) -> Result<Response<LoginReply>, Status> {
        self.auth_service.login(request).await
    }

    async fn validate_token(
        &self,
        request: Request<ValidateTokenRequest>,
    ) -> Result<Response<ValidateTokenReply>, Status> {
        self.auth_service.validate_token(request).await
    }

    async fn get_all_users(
        &self,
        _: Request<GetAllUsersRequest>,
    ) -> Result<Response<GetAllUsersReply>, Status> {
        self.user_service.get_all().await
    }
}

impl MyUser {
    pub fn new(auth_service: AuthService, user_service: Arc<UserService>) -> Self {
        Self {
            auth_service,
            user_service,
        }
    }
}

pub fn auth_server(
    auth_service: AuthService,
    user_service: Arc<UserService>,
) -> UserServer<MyUser> {
    UserServer::new(MyUser::new(auth_service, user_service))
}

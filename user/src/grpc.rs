use crate::proto::user::user_server::{User, UserServer};
use crate::proto::user::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest, ValidateTokenReply,
    ValidateTokenRequest,
};
use crate::services::auth::AuthService;
use tonic::{Request, Response, Status};

#[derive(Debug)]
pub struct MyUser {
    pub auth_service: AuthService,
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
}

impl MyUser {
    pub fn new(auth_service: AuthService) -> Self {
        Self { auth_service }
    }
}

pub fn auth_server(auth_service: AuthService) -> UserServer<MyUser> {
    UserServer::new(MyUser::new(auth_service))
}

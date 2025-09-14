use crate::proto::auth::auth_server::{Auth, AuthServer};
use crate::proto::auth::{
    GetGoogleLoginUrlReply, GetGoogleLoginUrlRequest, LoginReply, LoginRequest,
};
use crate::services::auth::AuthService;
use tonic::{Request, Response, Status};

#[derive(Debug)]
pub struct MyAuth {
    pub auth_service: AuthService,
}

#[tonic::async_trait]
impl Auth for MyAuth {
    async fn get_google_login_url(
        &self,
        request: Request<GetGoogleLoginUrlRequest>,
    ) -> Result<Response<GetGoogleLoginUrlReply>, Status> {
        self.auth_service.get_google_login_url(request)
    }

    async fn login(&self, request: Request<LoginRequest>) -> Result<Response<LoginReply>, Status> {
        self.auth_service.login(request).await
    }
}

impl MyAuth {
    pub fn new(auth_service: AuthService) -> Self {
        Self { auth_service }
    }
}

pub fn auth_server(auth_service: AuthService) -> AuthServer<MyAuth> {
    AuthServer::new(MyAuth::new(auth_service))
}

use crate::proto::auth::auth_server::{Auth, AuthServer};
use crate::proto::auth::{LoginReply, LoginRequest, RegisterReply, RegisterRequest};
use crate::services::auth::AuthService;
use tonic::{Request, Response, Status};

#[derive(Debug, Default)]
pub struct MyAuth {
    pub auth_service: AuthService,
}

#[tonic::async_trait]
impl Auth for MyAuth {
    async fn register(
        &self,
        request: Request<RegisterRequest>,
    ) -> Result<Response<RegisterReply>, Status> {
        self.auth_service.register(request).await
    }

    async fn login(&self, request: Request<LoginRequest>) -> Result<Response<LoginReply>, Status> {
        self.auth_service.login(request).await
    }
}

pub fn auth_server() -> AuthServer<MyAuth> {
    AuthServer::new(MyAuth::default())
}

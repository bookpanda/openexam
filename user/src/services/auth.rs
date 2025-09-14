use tonic::{Request, Response, Status};

use crate::proto::auth::{LoginReply, LoginRequest, RegisterReply, RegisterRequest};
use crate::repositories::user::UserRepo;

#[derive(Debug, Default)]
pub struct AuthService {
    pub auth_repo: UserRepo,
}

impl AuthService {
    pub async fn register(
        &self,
        request: Request<RegisterRequest>,
    ) -> Result<Response<RegisterReply>, Status> {
        Ok(Response::new(RegisterReply {
            message: "Hello, world!".to_string(),
        }))
    }

    pub async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<LoginReply>, Status> {
        Ok(Response::new(LoginReply {
            message: "Hello, world!".to_string(),
        }))
    }
}

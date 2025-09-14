use oauth2::{EndpointNotSet, EndpointSet};
use tonic::{Request, Response, Status};

use crate::config::config::OAuthConfig;
use crate::proto::auth::{LoginReply, LoginRequest, RegisterReply, RegisterRequest};
use crate::repositories::user::UserRepo;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl, basic::BasicClient};

#[derive(Debug)]
pub struct AuthService {
    pub auth_repo: UserRepo,
    oauth_client:
        BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointNotSet, EndpointSet>,
}

impl AuthService {
    pub fn new(auth_repo: UserRepo, oauth_config: OAuthConfig) -> anyhow::Result<Self> {
        let oauth_client = oauth2::basic::BasicClient::new(ClientId::new(oauth_config.client_id))
            .set_client_secret(ClientSecret::new(oauth_config.client_secret))
            .set_auth_uri(AuthUrl::new(oauth_config.auth_url).unwrap())
            .set_token_uri(TokenUrl::new(oauth_config.token_url).unwrap())
            .set_redirect_uri(RedirectUrl::new(oauth_config.redirect_url).unwrap());

        Ok(Self {
            auth_repo,
            oauth_client,
        })
    }

    pub async fn get_google_login_url(&self) -> Result<String, Status> {
        let (auth_url, _) = self.oauth_client.authorize_url(
            oauth2::AuthorizationCode::new(),
            "http://localhost:8080/auth/google/callback",
        );
        Ok(auth_url.to_string())
    }

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

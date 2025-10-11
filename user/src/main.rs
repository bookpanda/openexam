use crate::db::connect;
use crate::grpc::auth_server;
use crate::repositories::user::UserRepo;
use crate::services::auth::AuthService;
use crate::services::oauth::OAuthService;
use crate::services::user::UserService;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::task;
use tonic::transport::Server;

mod config;
mod db;
mod grpc;
mod models;
mod proto;
mod repositories;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::init();
    dotenvy::dotenv().ok();
    let config = config::config::Config::from_env()?;

    let pool = connect(&config.database).await;

    let user_repo = UserRepo::new(pool);
    let user_service = Arc::new(UserService::new(user_repo));

    let oauth_service = OAuthService::new(config.oauth)?;
    let auth_service = AuthService::new(user_service.clone(), oauth_service)?;

    let grpc_addr: SocketAddr = config.server.grpc_addr.parse()?;
    let grpc = Server::builder().add_service(auth_server(auth_service, user_service.clone()));

    println!("Server running on http://{}", grpc_addr);

    let grpc_task = task::spawn(async move {
        grpc.serve(grpc_addr).await.unwrap();
    });

    tokio::try_join!(grpc_task)?;
    Ok(())
}

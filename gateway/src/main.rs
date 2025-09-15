use crate::handlers::user::UserHandler;
use crate::proto::auth::auth_client::AuthClient;
use crate::routes::auth::auth_routes;
use crate::services::user::UserService;
use axum::Router;
use std::net::SocketAddr;
use std::sync::Arc;

mod config;
mod dtos;
mod handlers;
mod proto;
mod routes;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let config = config::config::Config::from_env()?;

    let user_client = AuthClient::connect(config.server.user_grpc_url).await?;
    let user_service = Arc::new(UserService::new(user_client));
    let user_handler = UserHandler::new(user_service);

    let app = Router::new().nest("/api", auth_routes().with_state(user_handler));

    let addr = SocketAddr::from(([127, 0, 0, 1], config.server.gateway_port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Server running on http://{}", addr);

    Ok(())
}

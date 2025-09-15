use crate::handlers::user::UserHandler;
use crate::proto::auth::auth_client::AuthClient;
use crate::routes::auth::auth_routes;
use axum::Router;
use std::net::SocketAddr;

mod config;
mod handlers;
mod proto;
mod routes;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let config = config::config::Config::from_env()?;

    let mut user_client = AuthClient::connect(config.server.user_grpc_url).await?;
    let user_handler = UserHandler::new(user_client);

    let app = Router::new().nest("/api", auth_routes(user_handler));

    let addr = SocketAddr::from(([127, 0, 0, 1], config.server.gateway_port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Server running on http://{}", addr);

    Ok(())
}

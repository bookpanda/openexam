use crate::grpc::auth_server;
use crate::routes::auth::auth_routes;
use crate::services::auth::AuthService;
use axum::Router;
use std::net::SocketAddr;
use tokio::task;
use tonic::transport::Server;

mod config;
mod handlers;
mod proto;
mod routes;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let config = config::config::Config::from_env()?;

    let auth_service = AuthService::new(user_repo, config.oauth)?;

    let app = Router::new().nest("/api", auth_routes());

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    let grpc_addr: SocketAddr = config.server.grpc_addr.parse()?;
    let grpc = Server::builder().add_service(auth_server(auth_service));

    println!("Server running on http://{}", grpc_addr);

    let grpc_task = task::spawn(async move {
        grpc.serve(grpc_addr).await.unwrap();
    });

    tokio::try_join!(grpc_task)?;
    Ok(())
}

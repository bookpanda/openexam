use crate::db::connect;
use crate::grpc::auth_server;
use crate::repositories::user::UserRepo;
use crate::services::auth::AuthService;
// use crate::routes::user::user_routes;
// use axum::Router;
// use sqlx::PgPool;
use std::net::SocketAddr;
use tokio::task;
use tonic::transport::Server;

mod config;
mod db;
mod grpc;
mod handlers;
mod models;
mod proto;
mod repositories;
mod routes;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    // Load configuration from environment
    let config = config::config::Config::from_env()?;

    // Initialize database connection
    let pool = connect(&config.database).await;

    // Create services with proper dependency injection
    let user_repo = UserRepo::default();
    let auth_service = AuthService::new(user_repo, config.oauth)?;

    // let app = Router::new().nest("/api", user_routes()).with_state(pool);

    // let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    // let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    // axum::serve(listener, app).await.unwrap();

    let grpc_addr: SocketAddr = config.server.grpc_addr.parse()?;
    let grpc = Server::builder().add_service(auth_server(auth_service));

    println!("Server running on http://{}", grpc_addr);

    let grpc_task = task::spawn(async move {
        grpc.serve(grpc_addr).await.unwrap();
    });

    tokio::try_join!(grpc_task)?;
    Ok(())
}

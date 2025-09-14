use crate::grpc::auth_server;
// use crate::routes::user::user_routes;
// use axum::Router;
// use sqlx::PgPool;
use std::net::SocketAddr;
use tokio::task;
use tonic::transport::Server;

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

    // let pool: PgPool = db::connect().await;

    // let app = Router::new().nest("/api", user_routes()).with_state(pool);

    // let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    // let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    // axum::serve(listener, app).await.unwrap();

    let grpc_addr: SocketAddr = "127.0.0.1:50051".parse()?;
    let grpc = Server::builder().add_service(auth_server());

    println!("Server running on http://{}", grpc_addr);

    let grpc_task = task::spawn(async move {
        grpc.serve(grpc_addr).await.unwrap();
    });

    tokio::try_join!(grpc_task)?;
    Ok(())
}

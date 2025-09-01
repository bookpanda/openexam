use crate::routes::user::user_routes;
use axum::Router;
use sqlx::PgPool;
use std::net::SocketAddr;

mod db;
mod handlers;
mod models;
mod repositories;
mod routes;
mod services;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let pool: PgPool = db::connect().await;

    let app = Router::new().nest("/api", user_routes(pool.clone()));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

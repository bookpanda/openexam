use axum::Router;
use sqlx::PgPool;

mod db;
mod handlers;
mod models;
mod repositories;
mod routes;
mod services;

#[tokio::main]
async fn main() {
    let pool: PgPool = db::connect().await;

    let app = Router::new().nest("/api", routes::user::user_routes(pool.clone()));

    println!("Server running on http://127.0.0.1:3000");
    axum::Server::bind(&([127, 0, 0, 1], 3000).into())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

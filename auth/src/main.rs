use axum::{
    Json, Router,
    extract::Path,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

// -----------------
// Data model
// -----------------
#[derive(Serialize, Deserialize)]
struct User {
    id: u32,
    name: String,
}

// -----------------
// Handlers
// -----------------

// GET /hello
async fn hello() -> &'static str {
    "Hello, Rust API!"
}

// GET /users/:id
async fn get_user(Path(id): Path<u32>) -> Json<User> {
    Json(User {
        id,
        name: format!("User{id}"),
    })
}

// POST /users
async fn create_user(Json(payload): Json<User>) -> Json<User> {
    // Here you would normally save to a database
    Json(payload)
}

// -----------------
// Main
// -----------------
#[tokio::main]
async fn main() {
    // Build app with routes
    let app = Router::new()
        .route("/hello", get(hello))
        .route("/users/:id", get(get_user))
        .route("/users", post(create_user));

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Axum server running at http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

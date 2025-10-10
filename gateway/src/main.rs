use crate::handlers::cheatsheet::CheatsheetHandler;
use crate::handlers::user::UserHandler;
use crate::proto::user::user_client::UserClient;
use crate::routes::auth::auth_routes;
use crate::routes::cheatsheet::cheatsheet_routes;
use crate::services::cheatsheet::CheatsheetService;
use crate::services::user::UserService;
use axum::Router;
use std::net::SocketAddr;
use tower_http::cors::Any;
use utoipa_swagger_ui::SwaggerUi;

mod config;
mod docs;
mod dtos;
mod handlers;
mod proto;
mod routes;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::init();
    dotenvy::dotenv().ok();
    let config = config::config::Config::from_env()?;

    let user_client = UserClient::connect(config.server.user_grpc_url).await?;
    let user_service = UserService::new(user_client);
    let user_handler = UserHandler::new(user_service);

    let cheatsheet_service = CheatsheetService::new();
    let cheatsheet_handler = CheatsheetHandler::new(cheatsheet_service);

    let cors = tower_http::cors::CorsLayer::new()
        .allow_headers(Any)
        .allow_methods(Any)
        .allow_origin(Any);

    let mut app = Router::new()
        .nest("/api", auth_routes().with_state(user_handler))
        .nest("/api", cheatsheet_routes().with_state(cheatsheet_handler))
        .layer(cors);

    if config.app.debug {
        app = app.merge(SwaggerUi::new("/swagger").url("/api-docs/openapi.json", docs::get_doc()));
    }

    let addr = SocketAddr::new(
        config.server.gateway_host.parse()?,
        config.server.gateway_port,
    );
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Server running on http://{}", addr);
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

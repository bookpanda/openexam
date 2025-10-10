use crate::handlers;
use crate::handlers::cheatsheet::CheatsheetHandler;
use axum::{
    Router,
    routing::{delete, get, post},
};

pub fn cheatsheet_routes() -> Router<CheatsheetHandler> {
    Router::new().route("/cheatsheet/files", get(handlers::cheatsheet::download))
    // .route("/cheatsheet/files", delete(handlers::cheatsheet::remove))
    // .route(
    //     "/cheatsheet/files/presign",
    //     get(handlers::cheatsheet::get_presigned_url),
    // )
    // .route("/cheatsheet/share", get(handlers::cheatsheet::share))
    // .route("/cheatsheet/unshare", get(handlers::cheatsheet::unshare))
}

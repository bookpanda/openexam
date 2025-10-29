use crate::handlers;
use crate::handlers::cheatsheet::CheatsheetHandler;
use axum::{
    Router,
    routing::{delete, get, post},
};

pub fn cheatsheet_routes() -> Router<CheatsheetHandler> {
    Router::new()
        .route(
            "/cheatsheet/presigned/upload",
            get(handlers::cheatsheet::get_presigned_upload_url),
        )
        .route(
            "/cheatsheet/presigned",
            get(handlers::cheatsheet::get_presigned_get_url),
        )
        .route("/cheatsheet/files", delete(handlers::cheatsheet::remove))
        .route(
            "/cheatsheet/files", // get all my files (slides + cheatsheets)
            get(handlers::cheatsheet::get_all_files),
        )
        .route(
            "/cheatsheet/files/{file_id}",
            get(handlers::cheatsheet::get_file),
        )
        .route("/cheatsheet/share", post(handlers::cheatsheet::share))
        .route("/cheatsheet/unshare", post(handlers::cheatsheet::unshare))
        .route("/cheatsheet/generate", post(handlers::cheatsheet::generate))
}

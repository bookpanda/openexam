use crate::handlers;
use crate::handlers::cheatsheet::CheatsheetHandler;
use axum::{
    Router,
    routing::{delete, get},
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
    // .route(
    //     "/cheatsheet/files/presign",
    //     get(handlers::cheatsheet::get_presigned_url),
    // )
    // .route("/cheatsheet/share", get(handlers::cheatsheet::share))
    // .route("/cheatsheet/unshare", get(handlers::cheatsheet::unshare))
}

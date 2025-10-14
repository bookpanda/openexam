use utoipa::{
    OpenApi,
    openapi::security::{Http, SecurityScheme},
};

#[derive(utoipa::OpenApi)]
#[openapi(
    paths(
        // crate::health_check,
        crate::handlers::user::get_google_login_url,
        crate::handlers::user::login,
        crate::handlers::user::validate_token,
        crate::handlers::user::get_all_users,
        crate::handlers::cheatsheet::get_presigned_upload_url,
        crate::handlers::cheatsheet::get_presigned_get_url,
        crate::handlers::cheatsheet::remove,
        crate::handlers::cheatsheet::get_all_files,
        crate::handlers::cheatsheet::get_file,
        crate::handlers::cheatsheet::share,
        crate::handlers::cheatsheet::unshare,
        crate::handlers::cheatsheet::generate,
    ),
    components(schemas(
        crate::dtos::ValidateTokenRequest,
        crate::dtos::ValidateTokenResponse,
        crate::dtos::LoginRequest,
        crate::dtos::LoginResponse,
        crate::dtos::GetPresignedUploadUrlResponse,
        crate::dtos::GetPresignedGetUrlResponse,
        crate::dtos::RemoveFileQuery,
        crate::dtos::GetFileResponse,
        crate::dtos::ShareRequest,
        crate::dtos::ShareResponse,
        crate::dtos::UnshareRequest,
        crate::dtos::UnshareResponse,
        crate::dtos::GenerateRequest,
        crate::dtos::GenerateResponse,
        crate::dtos::GetAllUsersResponse,
        crate::dtos::UserProfile,
    )),
    info(
        title = "openexam",
    ),
    servers(
        (url = "http://localhost:{port}", description = "Local server", variables(
            ("port" = (default= "3001", description = "port"))
        )),
        (url = "https://openexam.bookpanda.dev", description = "production server")
    ),
    tags(
        (name = "User"),
        (name = "Cheatsheet")
    )
)]
pub struct ApiDoc;

pub fn get_doc() -> utoipa::openapi::OpenApi {
    let mut doc = ApiDoc::openapi();

    if doc.components.is_none() {
        doc.components = Some(Default::default());
    }

    doc.components.as_mut().unwrap().add_security_scheme(
        "api_key",
        SecurityScheme::Http(Http::new(utoipa::openapi::security::HttpAuthScheme::Bearer)),
    );

    doc
}

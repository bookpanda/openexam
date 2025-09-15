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
    ),
    components(schemas(
        crate::dtos::ValidateTokenRequestDto,
        crate::dtos::ValidateTokenResponseDto,
        crate::dtos::LoginRequestDto,
        crate::dtos::LoginResponseDto,

    )),
    info(
        title = "openexam",
    ),
    servers(
        (url = "http://localhost:{port}", description = "Local server", variables(
            ("port" = (default= "3000", description = "port"))
        )),
        (url = "https://openexam.bookpanda.dev", description = "production server")
    ),
    tags(
        (name = "User")
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

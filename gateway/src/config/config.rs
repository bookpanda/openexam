use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database: DatabaseConfig,
    pub oauth: OAuthConfig,
    pub server: ServerConfig,
}

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_url: String,
    pub auth_url: String,
    pub token_url: String,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub grpc_addr: String,
    pub http_addr: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            database: DatabaseConfig::from_env()?,
            oauth: OAuthConfig::from_env()?,
            server: ServerConfig::from_env()?,
        })
    }
}

impl DatabaseConfig {
    fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "5".to_string())
                .parse()
                .expect("DATABASE_MAX_CONNECTIONS must be a valid number"),
        })
    }
}

impl OAuthConfig {
    fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            client_id: env::var("OAUTH_CLIENT_ID").expect("OAUTH_CLIENT_ID must be set"),
            client_secret: env::var("OAUTH_CLIENT_SECRET")
                .expect("OAUTH_CLIENT_SECRET must be set"),
            redirect_url: env::var("OAUTH_REDIRECT_URL").expect("OAUTH_REDIRECT_URL must be set"),
            auth_url: env::var("OAUTH_AUTH_URL")
                .unwrap_or_else(|_| "https://accounts.google.com/o/oauth2/v2/auth".to_string()),
            token_url: env::var("OAUTH_TOKEN_URL")
                .unwrap_or_else(|_| "https://www.googleapis.com/oauth2/v3/token".to_string()),
        })
    }
}

impl ServerConfig {
    fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            grpc_addr: env::var("GRPC_ADDR").unwrap_or_else(|_| "127.0.0.1:50051".to_string()),
            http_addr: env::var("HTTP_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string()),
        })
    }
}

use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub app: AppConfig,
    pub server: ServerConfig,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub debug: bool,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub gateway_port: u16,
    pub user_grpc_url: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            app: AppConfig::from_env()?,
            server: ServerConfig::from_env()?,
        })
    }
}

impl AppConfig {
    fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            debug: env::var("DEBUG")
                .unwrap_or_else(|_| "false".to_string())
                .parse()?,
        })
    }
}

impl ServerConfig {
    fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            gateway_port: env::var("GATEWAY_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()?,
            user_grpc_url: env::var("USER_GRPC_URL")
                .unwrap_or_else(|_| "http://127.0.0.1:50051".to_string()),
        })
    }
}

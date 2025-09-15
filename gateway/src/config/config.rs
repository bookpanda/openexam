use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub server: ServerConfig,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub gateway_port: u16,
    pub user_grpc_url: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            server: ServerConfig::from_env()?,
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
                .unwrap_or_else(|_| "127.0.0.1:50051".to_string()),
        })
    }
}

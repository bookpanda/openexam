use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, ToSchema)]
pub struct LoginRequest {
    pub code: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct LoginResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub token: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct ValidateTokenRequest {
    pub token: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct ValidateTokenResponse {
    pub id: String,
    pub email: String,
    pub name: String,
}

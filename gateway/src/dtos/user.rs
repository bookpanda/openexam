use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, ToSchema)]
pub struct LoginRequestDto {
    pub code: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct LoginResponseDto {
    pub id: String,
    pub email: String,
    pub name: String,
    pub token: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct ValidateTokenRequestDto {
    pub token: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct ValidateTokenResponseDto {
    pub id: String,
    pub email: String,
    pub name: String,
}

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct LoginRequestDto {
    pub code: String,
}

#[derive(Deserialize, Serialize)]
pub struct LoginResponseDto {
    pub id: String,
    pub email: String,
    pub name: String,
    pub token: String,
}

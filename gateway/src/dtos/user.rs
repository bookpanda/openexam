use serde::Deserialize;

#[derive(Deserialize)]
pub struct LoginRequestDto {
    pub code: String,
}

#[derive(Deserialize)]
pub struct LoginResponseDto {
    pub message: String,
}

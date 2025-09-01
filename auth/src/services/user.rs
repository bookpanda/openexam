use crate::models::user::User;
use crate::repositories::user::UserRepo;
use crate::services::response::ServiceResponse;
use sqlx::PgPool;

pub struct UserService;

impl UserService {
    pub async fn get_all(pool: &PgPool) -> ServiceResponse<Vec<User>> {
        match UserRepo::get_all(pool).await {
            Ok(users) => ServiceResponse::ok(users),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
    pub async fn get_one(pool: &PgPool, id: i32) -> ServiceResponse<User> {
        match UserRepo::get_one(pool, id).await {
            Ok(Some(user)) => ServiceResponse::ok(user),
            Ok(None) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn create(pool: &PgPool, name: String) -> ServiceResponse<User> {
        match UserRepo::create(pool, name).await {
            Ok(user) => ServiceResponse::created(user),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn update(pool: &PgPool, id: i32, name: String) -> ServiceResponse<User> {
        match UserRepo::update(pool, id, name).await {
            Ok(Some(user)) => ServiceResponse::ok(user),
            Ok(None) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn delete(pool: &PgPool, id: i32) -> ServiceResponse<String> {
        match UserRepo::delete(pool, id).await {
            Ok(true) => ServiceResponse::ok("User deleted".to_string()),
            Ok(false) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
}

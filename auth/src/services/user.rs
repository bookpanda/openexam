use crate::models::user::User;
use crate::repositories::user::UserRepo;
use sqlx::PgPool;

pub struct UserService;

impl UserService {
    pub async fn get_user(pool: &PgPool, id: i32) -> anyhow::Result<User> {
        // business logic can be added here
        UserRepo::get_user(pool, id).await
    }

    pub async fn create_user(pool: &PgPool, name: String) -> anyhow::Result<User> {
        // validate, transform, etc.
        UserRepo::create_user(pool, name).await
    }
}

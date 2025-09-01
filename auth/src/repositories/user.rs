use crate::models::user::User;
use sqlx::PgPool;

pub struct UserRepo;

impl UserRepo {
    pub async fn get_all(pool: &PgPool) -> anyhow::Result<Vec<User>> {
        let users = sqlx::query_as::<_, User>("SELECT id, name FROM users")
            .fetch_all(pool)
            .await?;
        Ok(users)
    }

    pub async fn get_one(pool: &PgPool, id: i32) -> anyhow::Result<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;
        Ok(user)
    }

    pub async fn create(pool: &PgPool, name: String) -> anyhow::Result<User> {
        let user =
            sqlx::query_as::<_, User>("INSERT INTO users (name) VALUES ($1) RETURNING id, name")
                .bind(name)
                .fetch_one(pool)
                .await?;
        Ok(user)
    }

    pub async fn update(pool: &PgPool, id: i32, name: String) -> anyhow::Result<Option<User>> {
        let updated_user = sqlx::query_as::<_, User>(
            "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name",
        )
        .bind(name)
        .bind(id)
        .fetch_optional(pool)
        .await?;
        Ok(updated_user)
    }

    pub async fn delete(pool: &PgPool, id: i32) -> anyhow::Result<bool> {
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}

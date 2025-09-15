use crate::models::user::User;
use sqlx::PgPool;

#[derive(Debug)]
pub struct UserRepo {
    pool: PgPool,
}

impl UserRepo {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_all(&self) -> anyhow::Result<Vec<User>> {
        let users = sqlx::query_as::<_, User>("SELECT id, name FROM users")
            .fetch_all(&self.pool)
            .await?;
        Ok(users)
    }

    pub async fn get_one(&self, id: i32) -> anyhow::Result<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(user)
    }

    pub async fn find_by_email(&self, email: String) -> anyhow::Result<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await?;
        Ok(user)
    }

    pub async fn create(&self, name: String) -> anyhow::Result<User> {
        let user =
            sqlx::query_as::<_, User>("INSERT INTO users (name) VALUES ($1) RETURNING id, name")
                .bind(name)
                .fetch_one(&self.pool)
                .await?;
        Ok(user)
    }

    pub async fn update(&self, id: i32, name: String) -> anyhow::Result<Option<User>> {
        let updated_user = sqlx::query_as::<_, User>(
            "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name",
        )
        .bind(name)
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(updated_user)
    }

    pub async fn delete(&self, id: i32) -> anyhow::Result<bool> {
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}

use dotenvy::dotenv;
use sqlx::PgPool;
use std::env;

pub async fn connect() -> PgPool {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to DB")
}

use crate::models::user::User;
use crate::repositories::user::UserRepo;
use crate::services::response::ServiceResponse;

#[derive(Debug)]
pub struct UserService {
    user_repo: UserRepo,
}

impl UserService {
    pub fn new(user_repo: UserRepo) -> Self {
        Self { user_repo }
    }

    pub async fn get_all(&self) -> ServiceResponse<Vec<User>> {
        match self.user_repo.get_all().await {
            Ok(users) => ServiceResponse::ok(users),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
    pub async fn get_one(&self, id: i32) -> ServiceResponse<User> {
        match self.user_repo.get_one(id).await {
            Ok(Some(user)) => ServiceResponse::ok(user),
            Ok(None) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn find_by_email(&self, email: String) -> ServiceResponse<User> {
        match self.user_repo.find_by_email(email).await {
            Ok(Some(user)) => ServiceResponse::ok(user),
            Ok(None) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn create(&self, name: String) -> ServiceResponse<User> {
        match self.user_repo.create(name).await {
            Ok(user) => ServiceResponse::created(user),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn update(&self, id: i32, name: String) -> ServiceResponse<User> {
        match self.user_repo.update(id, name).await {
            Ok(Some(user)) => ServiceResponse::ok(user),
            Ok(None) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }

    pub async fn delete(&self, id: i32) -> ServiceResponse<String> {
        match self.user_repo.delete(id).await {
            Ok(true) => ServiceResponse::ok("User deleted".to_string()),
            Ok(false) => ServiceResponse::not_found("User not found"),
            Err(_) => ServiceResponse::internal_error("Database error"),
        }
    }
}

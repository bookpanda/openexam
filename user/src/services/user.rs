use log::{error, info};
use tonic::Status;

use crate::models::user::User;
use crate::repositories::user::UserRepo;

#[derive(Debug)]
pub struct UserService {
    user_repo: UserRepo,
}

impl UserService {
    pub fn new(user_repo: UserRepo) -> Self {
        Self { user_repo }
    }

    pub async fn get_all(&self) -> Result<Vec<User>, Status> {
        match self.user_repo.get_all().await {
            Ok(users) => {
                info!("Successfully retrieved {} users", users.len());
                Ok(users)
            }
            Err(e) => {
                error!("Failed to get all users: {:?}", e);
                Err(Status::internal("Database error"))
            }
        }
    }
    pub async fn get_one(&self, id: i32) -> Result<User, Status> {
        match self.user_repo.get_one(id).await {
            Ok(Some(user)) => Ok(user),
            Ok(None) => Err(Status::not_found("User not found")),
            Err(e) => {
                error!("Failed to get one user: {:?}", e);
                Err(Status::internal("Database error"))
            }
        }
    }

    pub async fn find_by_email(&self, email: String) -> Result<User, Status> {
        match self.user_repo.find_by_email(email).await {
            Ok(Some(user)) => Ok(user),
            Ok(None) => Err(Status::not_found("User not found")),
            Err(e) => {
                error!("Failed to find user by email: {:?}", e);
                Err(Status::internal("Database error"))
            }
        }
    }

    pub async fn create(&self, name: String) -> Result<User, Status> {
        match self.user_repo.create(name.clone()).await {
            Ok(user) => {
                info!("Successfully created user: {}", name);
                Ok(user)
            }
            Err(e) => {
                error!("Failed to create user '{}': {:?}", name, e);
                Err(Status::internal("Database error"))
            }
        }
    }

    pub async fn update(&self, id: i32, name: String) -> Result<User, Status> {
        match self.user_repo.update(id, name).await {
            Ok(Some(user)) => Ok(user),
            Ok(None) => Err(Status::not_found("User not found")),
            Err(e) => {
                error!("Failed to update user: {:?}", e);
                Err(Status::internal("Database error"))
            }
        }
    }

    pub async fn delete(&self, id: i32) -> Result<String, Status> {
        match self.user_repo.delete(id).await {
            Ok(true) => Ok("User deleted".to_string()),
            Ok(false) => Err(Status::not_found("User not found")),
            Err(e) => {
                error!("Failed to delete user: {:?}", e);
                Err(Status::internal("Database error"))
            }
        }
    }
}

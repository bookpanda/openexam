use log::{error, info};
use tonic::{Response, Status};

use crate::models::user::User;
use crate::proto::user::{GetAllUsersReply, UserProfile};
use crate::repositories::user::UserRepo;

#[derive(Debug)]
pub struct UserService {
    user_repo: UserRepo,
}

impl UserService {
    pub fn new(user_repo: UserRepo) -> Self {
        Self { user_repo }
    }

    pub async fn get_all(&self) -> Result<Response<GetAllUsersReply>, Status> {
        match self.user_repo.get_all().await {
            Ok(users) => {
                info!("Successfully retrieved {} users", users.len());
                Ok(Response::new(GetAllUsersReply {
                    users: users
                        .into_iter()
                        .map(|user| UserProfile {
                            id: user.id.to_string(),
                            name: user.name,
                        })
                        .collect(),
                }))
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

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>, Status> {
        match self.user_repo.find_by_email(email).await {
            Ok(Some(user)) => Ok(Some(user)),
            Ok(None) => Ok(None),
            Err(e) => {
                error!("Failed to find user by email: {:?}", e);
                Err(Status::internal("Database error"))
            }
        }
    }

    pub async fn create(&self, user: &User) -> Result<User, Status> {
        match self.user_repo.create(&user).await {
            Ok(user) => {
                info!("Successfully created user: {}", user.email);
                Ok(user)
            }
            Err(e) => {
                error!("Failed to create user '{}': {:?}", user.email, e);
                Err(Status::internal("Failed to create user"))
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

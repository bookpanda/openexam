"""Service for tracking S3 objects in DynamoDB."""

import logging
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from config import Config

logger = logging.getLogger(__name__)


class TrackerService:
    """Service for tracking S3 objects in DynamoDB tables."""

    def __init__(self) -> None:
        """Initialize DynamoDB client."""
        self.dynamodb = boto3.resource("dynamodb")
        self.s3_client = boto3.client("s3")

    def track_creation(self, bucket: str, key: str, size: int) -> None:
        """
        Track S3 object creation in DynamoDB.

        Key format: {type}/{userId}/{file}
        - type: "slides" or "cheatsheets"
        - userId: user identifier
        - file: filename

        Args:
            bucket: S3 bucket name
            key: S3 object key
            size: Object size in bytes

        Raises:
            ValueError: If key format is invalid
            ClientError: If DynamoDB operation fails
        """
        try:
            # Parse the key
            file_type, user_id, filename = self._parse_key(key)
            logger.info(
                f"Parsed key: type={file_type}, userId={user_id}, file={filename}"
            )

            # Get content type from S3
            content_type = self._get_content_type(bucket, key)

            # Determine which table to use
            table = self.dynamodb.Table(Config.FILES_TABLE_NAME)

            # Generate unique ID
            item_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()

            # Create item
            item = {
                "id": item_id,
                "key": key,  # Full S3 key for reference
                "name": filename,
                "userId": user_id,
                "size": size,
                "contentType": content_type,
                "createdAt": timestamp,
                "updatedAt": timestamp,
            }

            logger.info(f"Creating item in {Config.FILES_TABLE_NAME}: {item_id}")
            table.put_item(Item=item)
            logger.info(f"Successfully tracked creation: {key}")

            # Create share entry for the owner
            self._create_owner_share(user_id, key, item_id)

        except ValueError as e:
            logger.error(f"Invalid key format: {str(e)}")
            raise
        except ClientError as e:
            logger.error(f"DynamoDB error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error tracking creation: {str(e)}")
            raise

    def track_deletion(self, bucket: str, key: str) -> None:
        """
        Track S3 object deletion by removing from DynamoDB.

        Args:
            bucket: S3 bucket name
            key: S3 object key

        Raises:
            ValueError: If key format is invalid
            ClientError: If DynamoDB operation fails
        """
        try:
            # Parse the key
            file_type, user_id, filename = self._parse_key(key)
            logger.info(
                f"Parsed key: type={file_type}, userId={user_id}, file={filename}"
            )

            # Determine which table to use
            table_name = Config.FILES_TABLE_NAME
            table = self.dynamodb.Table(table_name)

            # Query by key using GSI to find the item
            logger.info(f"Querying {table_name} for key={key}")
            response = table.query(
                IndexName="KeyIndex",
                KeyConditionExpression="#key = :key",
                ExpressionAttributeNames={
                    "#key": "key",
                },
                ExpressionAttributeValues={
                    ":key": key,
                },
            )

            items = response.get("Items", [])
            if not items:
                logger.warning(f"Item not found for deletion: {key}")
                return

            # Delete the item(s) and associated shares
            for item in items:
                item_id = item["id"]

                # Delete all shares associated with this file
                self._delete_file_shares(item_id)

                # Delete the file item
                logger.info(f"Deleting item from {table_name}: {item_id}")
                table.delete_item(Key={"id": item_id})
                logger.info(f"Successfully deleted item: {item_id}")

            logger.info(f"Successfully tracked deletion: {key}")

        except ValueError as e:
            logger.error(f"Invalid key format: {str(e)}")
            raise
        except ClientError as e:
            logger.error(f"DynamoDB error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error tracking deletion: {str(e)}")
            raise

    def _parse_key(self, key: str) -> tuple[str, str, str]:
        """
        Parse S3 key into components.

        Expected format: {type}/{userId}/{file}

        Args:
            key: S3 object key

        Returns:
            Tuple of (file_type, user_id, filename)

        Raises:
            ValueError: If key format is invalid
        """
        # Remove leading slash if present
        key = key.lstrip("/")

        # Split the key
        parts = key.split("/", 2)

        if len(parts) < 3:
            raise ValueError(
                f"Invalid key format: {key}. Expected format: 'type/userId/filename'"
            )

        file_type, user_id, filename = parts

        # Validate file type
        if file_type not in ["slides", "cheatsheets"]:
            raise ValueError(
                f"Invalid file type: {file_type}. Expected 'slides' or 'cheatsheets'"
            )

        if not user_id:
            raise ValueError(f"Missing userId in key: {key}")
        if not filename:
            raise ValueError(f"Missing filename in key: {key}")

        return file_type, user_id, filename

    def _get_content_type(self, bucket: str, key: str) -> str:
        """
        Get content type from S3 object metadata.

        Args:
            bucket: S3 bucket name
            key: S3 object key

        Returns:
            Content type string
        """
        try:
            response = self.s3_client.head_object(Bucket=bucket, Key=key)
            content_type = response.get("ContentType", "application/octet-stream")
            logger.debug(f"Content type for {key}: {content_type}")
            return content_type
        except ClientError as e:
            logger.warning(f"Could not get content type for {key}: {str(e)}")
            return "application/octet-stream"

    def _create_owner_share(self, user_id: str, key: str, file_id: str) -> None:
        """
        Create a share entry for the file owner.

        Args:
            user_id: Owner's user ID
            key: S3 object key
            file_id: File ID from files table

        Raises:
            ClientError: If DynamoDB operation fails
        """
        try:
            shares_table = self.dynamodb.Table(Config.SHARES_TABLE_NAME)

            share_item = {
                "userId": user_id,
                "key": key,
                "fileId": file_id,
            }

            logger.info(
                f"Creating share entry for owner: userId={user_id}, fileId={file_id}"
            )
            shares_table.put_item(Item=share_item)
            logger.info(f"Successfully created owner share for file: {file_id}")

        except ClientError as e:
            logger.error(f"Failed to create owner share: {str(e)}")
            # Don't raise - we don't want to fail the file creation if share creation fails
        except Exception as e:
            logger.error(f"Unexpected error creating owner share: {str(e)}")

    def _delete_file_shares(self, file_id: str) -> None:
        """
        Delete all share entries associated with a file.

        Args:
            file_id: File ID from files table

        Raises:
            ClientError: If DynamoDB operation fails
        """
        try:
            shares_table = self.dynamodb.Table(Config.SHARES_TABLE_NAME)

            # Query all shares for this file using GSI
            logger.info(f"Querying shares for fileId={file_id}")
            response = shares_table.query(
                IndexName="FileIdIndex",
                KeyConditionExpression="fileId = :fileId",
                ExpressionAttributeValues={
                    ":fileId": file_id,
                },
            )

            shares = response.get("Items", [])
            logger.info(f"Found {len(shares)} shares to delete for fileId={file_id}")

            # Delete each share
            for share in shares:
                user_id = share["userId"]
                key = share["key"]
                logger.info(f"Deleting share: userId={user_id}, key={key}")
                shares_table.delete_item(Key={"userId": user_id, "key": key})

            logger.info(f"Successfully deleted all shares for file: {file_id}")

        except ClientError as e:
            logger.error(f"Failed to delete file shares: {str(e)}")
            # Don't raise - we don't want to fail the file deletion if share deletion fails
        except Exception as e:
            logger.error(f"Unexpected error deleting file shares: {str(e)}")

import logging
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from config import Config

logger = logging.getLogger(__name__)


class DynamoDBService:
    """Service for DynamoDB operations."""

    def __init__(self) -> None:
        """Initialize DynamoDB client."""
        self.dynamodb = boto3.resource("dynamodb")
        self.files_table = self.dynamodb.Table(Config.FILES_TABLE_NAME)

    def save_cheatsheet(
        self, key: str, name: str, user_id: str, size: int, content_type: str
    ) -> str:
        """
        Save cheatsheet metadata to DynamoDB.

        Args:
            key: S3 object key (with prefix, e.g., "abc123_file.pdf")
            name: Original filename
            user_id: User ID who owns the file
            size: File size in bytes
            content_type: MIME type

        Returns:
            Generated UUID for the cheatsheet

        Raises:
            ClientError: If DynamoDB operation fails
        """
        try:
            cheatsheet_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()

            item = {
                "id": cheatsheet_id,
                "key": key,
                "name": name,
                "userId": user_id,
                "size": size,
                "contentType": content_type,
                "createdAt": timestamp,
                "updatedAt": timestamp,
            }

            logger.info(f"Saving cheatsheet to DynamoDB: {key}")
            self.files_table.put_item(Item=item)

            logger.info(f"Successfully saved cheatsheet: id={cheatsheet_id}, key={key}")
            return cheatsheet_id

        except ClientError as error:
            error_code: str = error.response["Error"]["Code"]
            error_message: str = error.response["Error"]["Message"]
            logger.error(f"DynamoDB ClientError ({error_code}): {error_message}")
            raise
        except Exception as error:
            logger.error(f"Unexpected error saving to DynamoDB: {str(error)}")
            raise

    def get_cheatsheet_by_key(self, key: str) -> dict | None:
        """
        Get cheatsheet by S3 key using GSI.

        Args:
            key: S3 object key

        Returns:
            Cheatsheet item or None if not found
        """
        try:
            response = self.files_table.query(
                IndexName="KeyIndex",
                KeyConditionExpression="key = :key",
                ExpressionAttributeValues={":key": key},
            )

            items = response.get("Items", [])
            if items:
                return items[0]
            return None

        except ClientError as error:
            logger.error(f"Error querying cheatsheet by key: {error}")
            return None

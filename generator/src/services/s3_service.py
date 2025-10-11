import logging
import secrets

import boto3
from botocore.exceptions import ClientError

from config import Config
from services.dynamodb_service import DynamoDBService
from utils.s3_helpers import extract_user_id_and_name

logger = logging.getLogger(__name__)


class S3Service:
    """Service for S3 operations."""

    def __init__(self) -> None:
        """Initialize S3 client and DynamoDB service."""
        self.s3_client = boto3.client("s3")
        self.dynamodb_service = DynamoDBService()

    def process_file(self, bucket: str, key: str, size: int) -> None:
        """
        Process S3 file: read content, copy to cheatsheets prefix, save to DynamoDB.

        Args:
            bucket: S3 bucket name
            key: S3 object key (e.g., "slide/user123/file.pdf")
            size: Object size in bytes

        Raises:
            ClientError: If S3 operations fail
        """
        try:
            # Extract user ID and filename from the original key
            user_id, original_name = extract_user_id_and_name(key)
            logger.info(f"Extracted userId={user_id}, name={original_name}")

            # Generate random 6-character prefix
            random_prefix = secrets.token_hex(3)  # 3 bytes = 6 hex chars

            # Create new filename with prefix: "abc123_file.pdf"
            prefixed_name = f"{random_prefix}_{original_name}"

            # Create target key: "cheatsheets/user123/abc123_file.pdf"
            target_key = f"{Config.TARGET_PREFIX}/{user_id}/{prefixed_name}"

            # Get the object from S3
            logger.info(f"Reading object from s3://{bucket}/{key}")
            response = self.s3_client.get_object(Bucket=bucket, Key=key)

            # Read the content
            content: bytes = response["Body"].read()
            content_type: str = response.get("ContentType", "application/octet-stream")

            # Log content information
            self._log_content_info(content, content_type)

            # Copy to new location
            self._copy_to_cheatsheets(bucket, key, target_key, content_type)

            # Save metadata to DynamoDB
            # key field stores just the prefixed name: "abc123_file.pdf"
            cheatsheet_id = self.dynamodb_service.save_cheatsheet(
                key=prefixed_name,
                name=original_name,
                user_id=user_id,
                size=len(content),
                content_type=content_type,
            )

            # Tag the processed file
            self._tag_processed_file(bucket, target_key, key, response, cheatsheet_id)

            logger.info(
                f"Successfully processed file: {key} -> {target_key} (id={cheatsheet_id})"
            )

        except ClientError as error:
            error_code: str = error.response["Error"]["Code"]
            error_message: str = error.response["Error"]["Message"]
            logger.error(f"S3 ClientError ({error_code}): {error_message}")
            raise
        except Exception as error:
            logger.error(f"Unexpected error processing S3 object: {str(error)}")
            raise

    def _log_content_info(self, content: bytes, content_type: str) -> None:
        """
        Log information about file content.

        Args:
            content: File content as bytes
            content_type: MIME type of the content
        """
        logger.info(f"Content type: {content_type}")
        logger.info(f"Content size: {len(content)} bytes")

        # Try to decode and print content if it's text
        is_text = any(content_type.startswith(ct) for ct in Config.TEXT_CONTENT_TYPES)

        if is_text:
            try:
                text_content: str = content.decode("utf-8")
                preview = text_content[: Config.MAX_CONTENT_PREVIEW_CHARS]
                logger.info(
                    f"Content preview (first {Config.MAX_CONTENT_PREVIEW_CHARS} chars):\n{preview}"
                )
            except UnicodeDecodeError:
                logger.warning("Could not decode content as UTF-8")
        else:
            preview_bytes = content[: Config.MAX_BINARY_PREVIEW_BYTES]
            logger.info(
                f"Binary content, first {Config.MAX_BINARY_PREVIEW_BYTES} bytes: {preview_bytes}"
            )

    def _copy_to_cheatsheets(
        self, bucket: str, source_key: str, target_key: str, content_type: str
    ) -> None:
        """
        Copy file to cheatsheets prefix.

        Args:
            bucket: S3 bucket name
            source_key: Source object key
            target_key: Target object key
            content_type: Content type for the copied object
        """
        logger.info(f"Copying to new location: s3://{bucket}/{target_key}")

        copy_source: dict[str, str] = {"Bucket": bucket, "Key": source_key}

        self.s3_client.copy_object(
            CopySource=copy_source,
            Bucket=bucket,
            Key=target_key,
            ContentType=content_type,
            MetadataDirective="COPY",
        )

        logger.info(f"Successfully copied to: {target_key}")

    def _tag_processed_file(
        self,
        bucket: str,
        key: str,
        original_key: str,
        response: dict,
        cheatsheet_id: str,
    ) -> None:
        """
        Tag processed file with metadata.

        Args:
            bucket: S3 bucket name
            key: Object key to tag
            original_key: Original source key
            response: S3 GetObject response
            cheatsheet_id: DynamoDB cheatsheet ID
        """
        try:
            timestamp = int(response.get("LastModified", 0).timestamp())

            self.s3_client.put_object_tagging(
                Bucket=bucket,
                Key=key,
                Tagging={
                    "TagSet": [
                        {"Key": "ProcessedBy", "Value": "Lambda"},
                        {"Key": "OriginalKey", "Value": original_key},
                        {"Key": "ProcessedAt", "Value": str(timestamp)},
                        {"Key": "CheatsheetId", "Value": cheatsheet_id},
                    ]
                },
            )
            logger.debug(f"Tagged file: {key}")
        except ClientError as error:
            # Log but don't fail if tagging fails
            logger.warning(f"Failed to tag file {key}: {error}")

    def get_object(self, key: str) -> bytes:
        """
        Get object from S3.

        Args:
            key: S3 object key

        Returns:
            Object content as bytes

        Raises:
            ClientError: If S3 operation fails
        """
        try:
            logger.info(f"Getting object from S3: {key}")
            response = self.s3_client.get_object(Bucket=Config.S3_BUCKET, Key=key)
            content = response["Body"].read()
            logger.info(f"Retrieved {len(content)} bytes from {key}")
            return content
        except ClientError as error:
            logger.error(f"Failed to get object {key}: {str(error)}")
            raise

    def put_object(
        self, key: str, body: bytes, content_type: str = "application/pdf"
    ) -> None:
        """
        Put object to S3.

        Args:
            key: S3 object key
            body: Object content as bytes
            content_type: Content type for the object

        Raises:
            ClientError: If S3 operation fails
        """
        try:
            logger.info(f"Putting object to S3: {key} ({len(body)} bytes)")
            self.s3_client.put_object(
                Bucket=Config.S3_BUCKET,
                Key=key,
                Body=body,
                ContentType=content_type,
            )
            logger.info(f"Successfully uploaded {key}")
        except ClientError as error:
            logger.error(f"Failed to put object {key}: {str(error)}")
            raise

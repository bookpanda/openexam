"""
Lambda function to process S3 upload events from SQS.
Reads uploaded files and copies them to /cheatsheets prefix.
"""

import json
import logging
import os
from typing import Any, Dict, List
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client("s3")


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process S3 upload events from SQS messages.

    Args:
        event: Lambda event containing SQS records
        context: Lambda context object

    Returns:
        Dictionary with batchItemFailures for partial batch response
    """
    logger.info(f"Received event with {len(event['Records'])} records")

    batch_item_failures: List[Dict[str, str]] = []

    for record in event["Records"]:
        try:
            # Parse the S3 event from SQS message
            message_body: Dict[str, Any] = json.loads(record["body"])
            s3_records: List[Dict[str, Any]] = message_body.get("Records", [])

            if not s3_records:
                logger.warning(f"No S3 records found in message: {record['messageId']}")
                continue

            # Process the first S3 event (typically only one per message)
            s3_event: Dict[str, Any] = s3_records[0]

            # Extract S3 object information
            bucket_name: str = s3_event["s3"]["bucket"]["name"]
            object_key: str = unquote_plus(s3_event["s3"]["object"]["key"])
            object_size: int = s3_event["s3"]["object"]["size"]
            event_name: str = s3_event["eventName"]
            event_time: str = s3_event["eventTime"]

            logger.info(f"Processing {event_name} for file: {object_key}")
            logger.info(
                f"Bucket: {bucket_name}, Size: {object_size} bytes, Time: {event_time}"
            )

            # Skip if file is already in cheatsheets/ to avoid infinite loop
            if object_key.startswith("cheatsheets/"):
                logger.info(f"Skipping file already in cheatsheets/: {object_key}")
                continue

            # Process the uploaded file
            process_s3_object(bucket_name, object_key, object_size)

            logger.info(f"Successfully processed message: {record['messageId']}")

        except Exception as error:
            logger.error(
                f"Error processing record {record['messageId']}: {str(error)}",
                exc_info=True,
            )

            # Add failed message to batch item failures
            # This tells SQS to retry only the failed messages
            batch_item_failures.append({"itemIdentifier": record["messageId"]})

    # Return batch item failures for partial batch responses
    return {"batchItemFailures": batch_item_failures}


def process_s3_object(bucket: str, key: str, size: int) -> None:
    """
    Process the S3 object: read content and copy to /cheatsheets prefix.

    Args:
        bucket: S3 bucket name
        key: S3 object key
        size: Object size in bytes

    Raises:
        ClientError: If S3 operations fail
    """
    try:
        # Get the object from S3
        logger.info(f"Reading object from s3://{bucket}/{key}")
        response = s3_client.get_object(Bucket=bucket, Key=key)

        # Read the content
        content: bytes = response["Body"].read()
        content_type: str = response.get("ContentType", "application/octet-stream")

        # Log content information
        logger.info(f"Content type: {content_type}")
        logger.info(f"Content size: {len(content)} bytes")

        # Try to decode and print content if it's text
        if content_type.startswith("text/") or content_type in [
            "application/json",
            "application/xml",
        ]:
            try:
                text_content: str = content.decode("utf-8")
                logger.info(f"Content preview (first 500 chars):\n{text_content[:500]}")
            except UnicodeDecodeError:
                logger.warning("Could not decode content as UTF-8")
        else:
            logger.info(f"Binary content, first 100 bytes: {content[:100]}")

        # Determine new key with /cheatsheets prefix
        new_key: str = get_cheatsheets_key(key)

        logger.info(f"Copying to new location: s3://{bucket}/{new_key}")

        # Copy the object to the new location
        copy_source: Dict[str, str] = {"Bucket": bucket, "Key": key}

        s3_client.copy_object(
            CopySource=copy_source,
            Bucket=bucket,
            Key=new_key,
            ContentType=content_type,
            MetadataDirective="COPY",
        )

        logger.info(f"Successfully copied to: {new_key}")

        # Optional: Add metadata about the processing
        s3_client.put_object_tagging(
            Bucket=bucket,
            Key=new_key,
            Tagging={
                "TagSet": [
                    {"Key": "ProcessedBy", "Value": "Lambda"},
                    {"Key": "OriginalKey", "Value": key},
                    {
                        "Key": "ProcessedAt",
                        "Value": str(int(response.get("LastModified", 0).timestamp())),
                    },
                ]
            },
        )

    except ClientError as error:
        error_code: str = error.response["Error"]["Code"]
        error_message: str = error.response["Error"]["Message"]
        logger.error(f"S3 ClientError ({error_code}): {error_message}")
        raise
    except Exception as error:
        logger.error(f"Unexpected error processing S3 object: {str(error)}")
        raise


def get_cheatsheets_key(original_key: str) -> str:
    """
    Convert original key to cheatsheets prefix.

    Examples:
        "slide/user123/file.pdf" -> "cheatsheets/user123/file.pdf"
        "user123/file.pdf" -> "cheatsheets/user123/file.pdf"
        "file.pdf" -> "cheatsheets/file.pdf"

    Args:
        original_key: Original S3 object key

    Returns:
        New key with /cheatsheets prefix
    """
    # Remove leading slash if present
    key: str = original_key.lstrip("/")

    # Split the key into parts
    parts: List[str] = key.split("/", 1)

    # Check if first part is 'slide' or 'slides'
    if len(parts) > 1 and parts[0].lower() in ["slide", "slides"]:
        # Replace slide prefix with cheatsheets
        remaining_path: str = parts[1]
        new_key: str = f"cheatsheets/{remaining_path}"
    else:
        # Add cheatsheets prefix
        new_key: str = f"cheatsheets/{key}"

    return new_key

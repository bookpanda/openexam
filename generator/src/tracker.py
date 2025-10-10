"""
Tracker Lambda handler - monitors S3 object creation/deletion.

This Lambda is triggered directly by S3 events (not through SQS)
and updates DynamoDB tables to track file metadata.

Expected S3 key format: {type}/{userId}/{filename}
- type: "slides" or "cheatsheets"
- userId: user identifier
- filename: name of the file
"""

import logging
from typing import Any

from config import Config
from handlers.s3_handler import S3Handler
from utils.logger import setup_logger

# Configure logging
logger = setup_logger(__name__)
logger.setLevel(logging.INFO)


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    Main entry point called by AWS Lambda when triggered by S3 events.

    Handles both ObjectCreated:* and ObjectRemoved:* events.

    Args:
        event: Lambda event containing S3 records
        context: Lambda context object

    Returns:
        Dictionary with processing status

    Example event structure:
        {
            "Records": [
                {
                    "eventVersion": "2.1",
                    "eventSource": "aws:s3",
                    "eventName": "ObjectCreated:Put",
                    "eventTime": "2025-10-10T12:00:00.000Z",
                    "s3": {
                        "bucket": {"name": "my-bucket"},
                        "object": {"key": "slides/user123/file.pdf", "size": 1024}
                    }
                }
            ]
        }
    """
    try:
        # Validate configuration
        Config.validate()

        # Additional validation for tracker-specific config
        if not Config.SLIDES_TABLE_NAME:
            logger.warning("SLIDES_TABLE_NAME not configured")

        # Process S3 events
        s3_handler = S3Handler()
        return s3_handler.handle_event(event)

    except Exception as error:
        logger.error(f"Fatal error in Lambda handler: {str(error)}", exc_info=True)
        return {"statusCode": 500, "error": str(error)}

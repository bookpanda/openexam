"""
Main Lambda handler entry point.

This module serves as the entry point for AWS Lambda.
"""

import logging
from typing import Any

from config import Config
from handlers.sqs_handler import SQSHandler
from utils.logger import setup_logger

# Configure logging
logger = setup_logger(__name__)
logger.setLevel(logging.INFO)


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    AWS Lambda handler function.

    This is the main entry point called by AWS Lambda when the function is invoked.

    Args:
        event: Lambda event containing SQS records with S3 notifications
        context: Lambda context object

    Returns:
        Dictionary with batchItemFailures for partial batch response

    Example event structure:
        {
            "Records": [
                {
                    "messageId": "...",
                    "body": "{...S3 event...}",
                    ...
                }
            ]
        }
    """
    try:
        Config.validate()

        # Initialize handler
        sqs_handler = SQSHandler()

        # Process the event
        return sqs_handler.handle_event(event)

    except Exception as error:
        logger.error(f"Fatal error in Lambda handler: {str(error)}", exc_info=True)
        # Return all messages as failures if there's a fatal error
        return {
            "batchItemFailures": [
                {"itemIdentifier": record["messageId"]} for record in event["Records"]
            ]
        }

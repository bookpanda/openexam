import json
import logging
from typing import Any
from urllib.parse import unquote_plus

from services.s3_service import S3Service
from utils.s3_helpers import should_skip_file

logger = logging.getLogger(__name__)


class SQSHandler:
    def __init__(self) -> None:
        self.s3_service = S3Service()

    def handle_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Process SQS event containing S3 notifications.

        Args:
            event: Lambda event containing SQS records

        Returns:
            dictionary with batchItemFailures for partial batch response
        """
        logger.info(f"Received event with {len(event['Records'])} records")

        batch_item_failures: list[dict[str, str]] = []

        for record in event["Records"]:
            try:
                self._process_record(record)
                logger.info(f"Successfully processed message: {record['messageId']}")

            except Exception as error:
                logger.error(
                    f"Error processing record {record['messageId']}: {str(error)}",
                    exc_info=True,
                )
                # Add failed message to batch item failures
                batch_item_failures.append({"itemIdentifier": record["messageId"]})

        return {"batchItemFailures": batch_item_failures}

    def _process_record(self, record: dict[str, Any]) -> None:
        """
        Process a single SQS record.

        Args:
            record: SQS record containing S3 event

        Raises:
            Exception: If processing fails
        """
        # Parse the S3 event from SQS message
        message_body: dict[str, Any] = json.loads(record["body"])
        s3_records: list[dict[str, Any]] = message_body.get("Records", [])

        if not s3_records:
            logger.warning(f"No S3 records found in message: {record['messageId']}")
            return

        # Process the first S3 event (typically only one per message)
        s3_event: dict[str, Any] = s3_records[0]

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
        if should_skip_file(object_key):
            logger.info(f"Skipping file already in target prefix: {object_key}")
            return

        # Process the uploaded file
        self.s3_service.process_file(bucket_name, object_key, object_size)

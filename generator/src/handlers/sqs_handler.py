import json
import logging
from typing import Any
from urllib.parse import unquote_plus

from services.generator_service import GeneratorService
from services.s3_service import S3Service
from utils.s3_helpers import should_skip_file

logger = logging.getLogger(__name__)


class SQSHandler:
    def __init__(self) -> None:
        self.s3_service = S3Service()
        self.generator_service = GeneratorService()

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
            record: SQS record containing S3 event or generation request

        Raises:
            Exception: If processing fails
        """
        # Parse the message body
        message_body: dict[str, Any] = json.loads(record["body"])

        # Check if this is a generation request
        if (
            "fileIds" in message_body
            and "userId" in message_body
            and "requestId" in message_body
            and "responseQueueUrl" in message_body
        ):
            logger.info("Processing cheatsheet generation request")
            self._handle_generation_request(message_body)
            return

        # Otherwise, it's an S3 event notification
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

    def _handle_generation_request(self, body: dict[str, Any]) -> None:
        """
        Handle a cheatsheet generation request.

        Args:
            body: Message body containing fileIds, userId, requestId, and responseQueueUrl

        Raises:
            Exception: If generation fails
        """
        file_ids: list[str] = body.get("fileIds", [])
        user_id: str = body.get("userId", "")
        request_id: str = body.get("requestId", "")
        response_queue_url: str = body.get("responseQueueUrl", "")

        if not file_ids or not user_id or not request_id or not response_queue_url:
            raise ValueError(
                "fileIds, userId, requestId, and responseQueueUrl are required"
            )

        logger.info(
            f"Generating cheatsheet for user {user_id} with {len(file_ids)} files (request: {request_id})"
        )
        result = self.generator_service.generate_cheatsheet(
            file_ids, user_id, request_id, response_queue_url
        )
        logger.info(f"Cheatsheet generation completed: {result}")

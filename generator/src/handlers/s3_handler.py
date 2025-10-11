"""Handler for S3 events (direct from S3, not SQS)."""

import json
import logging
from typing import Any
from urllib.parse import unquote_plus

from services.tracker_service import TrackerService

logger = logging.getLogger(__name__)


class S3Handler:
    """Handles S3 events for object creation and deletion."""

    def __init__(self) -> None:
        """Initialize the handler with tracker service."""
        self.tracker_service = TrackerService()

    def handle_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Process S3 event containing object creation/deletion notifications.

        Args:
            event: Lambda event containing S3 records

        Returns:
            Dictionary with processing status
        """
        logger.info(f"Received S3 event with {len(event.get('Records', []))} records")

        processed = 0
        failed = 0

        for record in event.get("Records", []):
            try:
                self._process_record(record)
                processed += 1
                logger.info(f"Successfully processed record")

            except Exception as error:
                logger.error(f"Error processing record: {str(error)}", exc_info=True)
                failed += 1

        logger.info(f"Processing complete: {processed} succeeded, {failed} failed")
        return {"statusCode": 200, "processed": processed, "failed": failed}

    def _process_record(self, record: dict[str, Any]) -> None:
        """
        Process a single S3 event record.

        Args:
            record: S3 event record

        Raises:
            Exception: If processing fails
        """
        # Extract event information
        event_name: str = record.get("eventName", "")
        bucket_name: str = record["s3"]["bucket"]["name"]
        object_key: str = unquote_plus(record["s3"]["object"]["key"])
        object_size: int = record["s3"]["object"].get("size", 0)
        event_time: str = record.get("eventTime", "")

        logger.info(f"Event: {event_name}")
        logger.info(f"Object: s3://{bucket_name}/{object_key}")
        logger.info(f"Size: {object_size} bytes, Time: {event_time}")

        # Determine if this is a creation or deletion event
        if event_name.startswith("ObjectCreated"):
            self._handle_creation(bucket_name, object_key, object_size)
        elif event_name.startswith("ObjectRemoved"):
            self._handle_deletion(bucket_name, object_key)
        else:
            logger.warning(f"Unknown event type: {event_name}")

    def _handle_creation(
        self, bucket_name: str, object_key: str, object_size: int
    ) -> None:
        """
        Handle object creation event.

        Args:
            bucket_name: S3 bucket name
            object_key: S3 object key (format: {type}/{userId}/{file})
            object_size: Object size in bytes
        """
        logger.info(f"Handling creation: {object_key}")
        self.tracker_service.track_creation(bucket_name, object_key, object_size)

    def _handle_deletion(self, bucket_name: str, object_key: str) -> None:
        """
        Handle object deletion event.

        Args:
            bucket_name: S3 bucket name
            object_key: S3 object key (format: {type}/{userId}/{file})
        """
        logger.info(f"Handling deletion: {object_key}")
        self.tracker_service.track_deletion(bucket_name, object_key)

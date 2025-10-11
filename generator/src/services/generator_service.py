"""
Generator Service for creating combined cheatsheets.
"""

import json
import logging
import uuid
from typing import List

import boto3
from botocore.exceptions import ClientError

from config import Config
from services.pdf_service import PDFService
from services.s3_service import S3Service
from utils.logger import setup_logger

logger = setup_logger(__name__)


class GeneratorService:
    """Service for generating combined cheatsheets from multiple files."""

    def __init__(self):
        """Initialize the generator service with S3 client."""
        self.s3_service = S3Service()
        self.pdf_service = PDFService()
        self.dynamodb = boto3.resource("dynamodb", region_name=Config.AWS_REGION)
        self.sqs_client = boto3.client("sqs", region_name=Config.AWS_REGION)

    def generate_cheatsheet(
        self,
        file_ids: List[str],
        user_id: str,
        request_id: str,
        response_queue_url: str,
    ) -> dict:
        """
        Generate a combined cheatsheet from multiple files.

        Args:
            file_ids: List of file IDs to combine
            user_id: User ID who owns the files

        Returns:
            Dictionary with generated file information

        Raises:
            Exception: If generation fails
        """
        try:
            logger.info(
                f"Starting cheatsheet generation for user {user_id} with {len(file_ids)} files"
            )

            # 1. Get file information from DynamoDB
            files = self._get_files_from_dynamodb(file_ids)
            logger.info(f"Retrieved {len(files)} files from DynamoDB")

            # 2. Download PDFs from S3
            pdf_contents = []
            for file in files:
                key = file.get("key")
                if not key:
                    logger.warning(f"File {file.get('id')} has no key, skipping")
                    continue

                logger.info(f"Downloading file from S3: {key}")
                pdf_data = self.s3_service.get_object(key)
                pdf_contents.append(pdf_data)

            if not pdf_contents:
                raise Exception("No valid PDF files found to merge")

            # 3. Merge PDFs
            logger.info(f"Merging {len(pdf_contents)} PDFs")
            merged_pdf = self.pdf_service.merge_pdfs(pdf_contents)

            # 4. Upload merged PDF to S3
            prefix = uuid.uuid4().hex[:6]
            output_key = f"cheatsheets/{user_id}/{prefix}_cheatsheet.pdf"
            logger.info(f"Uploading merged PDF to S3: {output_key}")

            self.s3_service.put_object(
                key=output_key, body=merged_pdf, content_type="application/pdf"
            )

            result = {
                "key": output_key,
                "user_id": user_id,
                "source_file_count": len(pdf_contents),
                "size": len(merged_pdf),
                "file_id": uuid.uuid4().hex,
            }

            logger.info(f"Successfully generated cheatsheet: {output_key}")

            # Send success response to SQS
            self._send_response(
                response_queue_url,
                request_id,
                result["file_id"],
                output_key,
                success=True,
            )

            return result

        except Exception as e:
            logger.error(f"Failed to generate cheatsheet: {str(e)}")
            # Send failure response to SQS
            self._send_response(
                response_queue_url, request_id, "", "", success=False, error=str(e)
            )
            raise

    def _get_files_from_dynamodb(self, file_ids: List[str]) -> List[dict]:
        """
        Retrieve file information from DynamoDB.

        Args:
            file_ids: List of file IDs

        Returns:
            List of file records

        Raises:
            ClientError: If DynamoDB query fails
        """
        try:
            table = self.dynamodb.Table(Config.FILES_TABLE_NAME)
            files = []

            for file_id in file_ids:
                response = table.get_item(Key={"id": file_id})
                item = response.get("Item")
                if item:
                    files.append(item)
                else:
                    logger.warning(f"File not found in DynamoDB: {file_id}")

            return files

        except ClientError as e:
            logger.error(f"DynamoDB error: {str(e)}")
            raise

    def _send_response(
        self,
        response_queue_url: str,
        request_id: str,
        file_id: str,
        key: str,
        success: bool,
        error: str = "",
    ) -> None:
        """
        Send generation response to SQS response queue.

        Args:
            response_queue_url: SQS response queue URL
            request_id: Request ID from the original request
            file_id: Generated file ID
            key: S3 key of generated file
            success: Whether generation was successful
            error: Error message if failed
        """
        try:
            payload = {
                "request_id": request_id,
                "file_id": file_id,
                "key": key,
                "success": success,
            }
            if error:
                payload["error"] = error

            logger.info(f"Sending response to queue: {response_queue_url}")
            self.sqs_client.send_message(
                QueueUrl=response_queue_url, MessageBody=json.dumps(payload)
            )
            logger.info(f"Response sent successfully for request: {request_id}")

        except ClientError as e:
            logger.error(f"Failed to send response to SQS: {str(e)}")
            # Don't raise - response queue failure shouldn't fail the generation

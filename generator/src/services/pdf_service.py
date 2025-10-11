"""
PDF Service for combining multiple PDFs into one.
"""

import io
import logging
from typing import List

from pypdf import PdfMerger, PdfReader

from utils.logger import setup_logger

logger = setup_logger(__name__)


class PDFService:
    """Service for PDF operations like merging."""

    @staticmethod
    def merge_pdfs(pdf_files: List[bytes]) -> bytes:
        """
        Merge multiple PDF files into a single PDF.

        Args:
            pdf_files: List of PDF file contents as bytes

        Returns:
            Merged PDF as bytes

        Raises:
            Exception: If PDF merging fails
        """
        try:
            merger = PdfMerger()

            for pdf_data in pdf_files:
                # Read PDF from bytes
                pdf_stream = io.BytesIO(pdf_data)
                reader = PdfReader(pdf_stream)
                merger.append(reader)
                logger.info(f"Added PDF with {len(reader.pages)} pages")

            # Write merged PDF to bytes
            output = io.BytesIO()
            merger.write(output)
            merger.close()

            output.seek(0)
            merged_pdf = output.read()

            logger.info(f"Successfully merged {len(pdf_files)} PDFs")
            return merged_pdf

        except Exception as e:
            logger.error(f"Failed to merge PDFs: {str(e)}")
            raise

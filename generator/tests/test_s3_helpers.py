"""Tests for S3 helper functions."""

import pytest

from src.utils.s3_helpers import get_cheatsheets_key, should_skip_file


class TestGetCheatheetsKey:
    """Tests for get_cheatsheets_key function."""

    def test_slide_prefix_replacement(self) -> None:
        """Test that slide/ prefix is replaced with cheatsheets/."""
        result = get_cheatsheets_key("slide/user123/file.pdf")
        assert result == "cheatsheets/user123/file.pdf"

    def test_slides_prefix_replacement(self) -> None:
        """Test that slides/ prefix is also replaced."""
        result = get_cheatsheets_key("slides/user123/file.pdf")
        assert result == "cheatsheets/user123/file.pdf"

    def test_no_prefix_addition(self) -> None:
        """Test that cheatsheets/ prefix is added when no slide prefix exists."""
        result = get_cheatsheets_key("user123/file.pdf")
        assert result == "cheatsheets/user123/file.pdf"

    def test_single_file_addition(self) -> None:
        """Test that single file gets prefix."""
        result = get_cheatsheets_key("file.pdf")
        assert result == "cheatsheets/file.pdf"

    def test_leading_slash_removed(self) -> None:
        """Test that leading slash is handled correctly."""
        result = get_cheatsheets_key("/slide/user123/file.pdf")
        assert result == "cheatsheets/user123/file.pdf"

    def test_case_insensitive_prefix(self) -> None:
        """Test that prefix matching is case insensitive."""
        result = get_cheatsheets_key("SLIDE/user123/file.pdf")
        assert result == "cheatsheets/user123/file.pdf"


class TestShouldSkipFile:
    """Tests for should_skip_file function."""

    def test_skip_cheatsheets_prefix(self) -> None:
        """Test that files in cheatsheets/ are skipped."""
        assert should_skip_file("cheatsheets/user123/file.pdf") is True

    def test_dont_skip_slide_prefix(self) -> None:
        """Test that files in slide/ are not skipped."""
        assert should_skip_file("slide/user123/file.pdf") is False

    def test_dont_skip_other_prefix(self) -> None:
        """Test that files with other prefixes are not skipped."""
        assert should_skip_file("documents/user123/file.pdf") is False

    def test_dont_skip_no_prefix(self) -> None:
        """Test that files without prefix are not skipped."""
        assert should_skip_file("file.pdf") is False

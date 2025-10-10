"""Tests for extract_user_id_and_name function."""

import pytest
from utils.s3_helpers import extract_user_id_and_name


def test_extract_user_id_and_name_basic():
    """Test basic extraction from valid key."""
    user_id, name = extract_user_id_and_name("slide/user123/file.pdf")
    assert user_id == "user123"
    assert name == "file.pdf"


def test_extract_user_id_and_name_slides_prefix():
    """Test extraction with 'slides' prefix."""
    user_id, name = extract_user_id_and_name("slides/user456/document.txt")
    assert user_id == "user456"
    assert name == "document.txt"


def test_extract_user_id_and_name_with_leading_slash():
    """Test extraction with leading slash."""
    user_id, name = extract_user_id_and_name("/slide/user789/file.pdf")
    assert user_id == "user789"
    assert name == "file.pdf"


def test_extract_user_id_and_name_nested_path():
    """Test extraction with nested path in filename."""
    user_id, name = extract_user_id_and_name("slide/user123/folder/subfolder/file.pdf")
    assert user_id == "user123"
    assert name == "folder/subfolder/file.pdf"


def test_extract_user_id_and_name_special_chars():
    """Test extraction with special characters in filename."""
    user_id, name = extract_user_id_and_name("slide/user-123/my file (1).pdf")
    assert user_id == "user-123"
    assert name == "my file (1).pdf"


def test_extract_user_id_and_name_invalid_prefix():
    """Test error when prefix is not 'slide' or 'slides'."""
    with pytest.raises(ValueError, match="Invalid key prefix"):
        extract_user_id_and_name("documents/user123/file.pdf")


def test_extract_user_id_and_name_missing_parts():
    """Test error when key has insufficient parts."""
    with pytest.raises(ValueError, match="Invalid key format"):
        extract_user_id_and_name("slide/user123")


def test_extract_user_id_and_name_missing_user_id():
    """Test error when user ID is empty."""
    with pytest.raises(ValueError, match="Missing userId"):
        extract_user_id_and_name("slide//file.pdf")


def test_extract_user_id_and_name_missing_filename():
    """Test error when filename is missing."""
    with pytest.raises(ValueError, match="Invalid key format"):
        extract_user_id_and_name("slide/user123/")

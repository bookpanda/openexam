from config import Config


def should_skip_file(key: str) -> bool:
    """
    Check if file should be skipped to avoid infinite loops.

    Args:
        key: S3 object key

    Returns:
        True if file should be skipped
    """
    return key.startswith(f"{Config.TARGET_PREFIX}/")


def extract_user_id_and_name(key: str) -> tuple[str, str]:
    """
    Extract user ID and filename from S3 key.

    Expected format: "slide/userId/filename" or "slides/userId/filename"

    Examples:
        "slide/user123/file.pdf" -> ("user123", "file.pdf")
        "slides/user456/doc.txt" -> ("user456", "doc.txt")

    Args:
        key: S3 object key

    Returns:
        Tuple of (user_id, filename)

    Raises:
        ValueError: If key format is invalid
    """
    # Remove leading slash if present
    key = key.lstrip("/")

    # Split the key into parts
    parts = key.split("/")

    # Expected format: [prefix, userId, filename]
    if len(parts) < 3:
        raise ValueError(
            f"Invalid key format: {key}. Expected format: 'slide/userId/filename'"
        )

    # Check if first part is 'slide' or 'slides'
    if parts[0].lower() not in ["slide", "slides"]:
        raise ValueError(
            f"Invalid key prefix: {parts[0]}. Expected 'slide' or 'slides'"
        )

    user_id = parts[1]
    filename = "/".join(parts[2:])  # Handle filenames with slashes

    if not user_id:
        raise ValueError(f"Missing userId in key: {key}")
    if not filename:
        raise ValueError(f"Missing filename in key: {key}")

    return user_id, filename


def get_cheatsheets_key(original_key: str) -> str:
    """
    Convert original key to cheatsheets prefix.

    Examples:
        "slide/user123/file.pdf" -> "cheatsheets/user123/file.pdf"
        "slides/user123/file.pdf" -> "cheatsheets/user123/file.pdf"
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
    parts: list[str] = key.split("/", 1)

    # Check if first part is 'slide' or 'slides'
    if len(parts) > 1 and parts[0].lower() in ["slide", "slides"]:
        # Replace slide prefix with cheatsheets
        remaining_path: str = parts[1]
        new_key: str = f"{Config.TARGET_PREFIX}/{remaining_path}"
    else:
        # Add cheatsheets prefix
        new_key: str = f"{Config.TARGET_PREFIX}/{key}"

    return new_key

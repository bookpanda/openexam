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

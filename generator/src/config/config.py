import os


class Config:
    # S3 Configuration
    BUCKET_NAME: str = os.getenv("BUCKET_NAME", "")
    SOURCE_PREFIX: str = os.getenv("SOURCE_PREFIX", "slide")
    TARGET_PREFIX: str = os.getenv("TARGET_PREFIX", "cheatsheets")

    # DynamoDB Configuration
    SLIDES_TABLE_NAME: str = os.getenv("SLIDES_TABLE_NAME", "")
    CHEATSHEETS_TABLE_NAME: str = os.getenv("CHEATSHEETS_TABLE_NAME", "")

    # Processing Configuration
    MAX_CONTENT_PREVIEW_CHARS: int = int(os.getenv("MAX_CONTENT_PREVIEW_CHARS", "500"))
    MAX_BINARY_PREVIEW_BYTES: int = int(os.getenv("MAX_BINARY_PREVIEW_BYTES", "100"))

    # Text content types that should be decoded and logged
    TEXT_CONTENT_TYPES: tuple[str, ...] = (
        "text/",
        "application/json",
        "application/xml",
    )

    @classmethod
    def validate(cls) -> None:
        if not cls.BUCKET_NAME:
            raise ValueError("BUCKET_NAME environment variable is required")
        if not cls.CHEATSHEETS_TABLE_NAME:
            raise ValueError("CHEATSHEETS_TABLE_NAME environment variable is required")

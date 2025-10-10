# Cheatsheet Generator

AWS Lambda function that processes S3 file uploads and automatically copies them from `/slide/*` to `/cheatsheets/*` prefix.

## 📁 Project Structure

```
cheatsheet-generator/
├── src/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # Lambda handler entry point
│   ├── config.py            # Configuration management
│   ├── handlers/            # Event handlers
│   │   ├── __init__.py
│   │   └── sqs_handler.py   # SQS event processing
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   └── s3_service.py    # S3 operations
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── logger.py        # Logging setup
│       └── s3_helpers.py    # S3 helper functions
├── tests/                   # Unit tests
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies
├── pyproject.toml          # Project configuration
└── README.md               # This file
```

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns
- **Full Type Hints**: 100% typed code with mypy strict mode
- **Configurable**: Environment-based configuration
- **Logging**: Structured logging with different levels
- **Error Handling**: Proper exception handling with retry support
- **Testable**: Well-structured for unit testing

## 📦 Installation

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Or using pip with optional dependencies
pip install -e ".[dev]"
```

### Production (Lambda)

```bash
pip install -r requirements.txt
```

## 🔧 Configuration

Set environment variables:

```bash
export BUCKET_NAME="your-bucket-name"
export SOURCE_PREFIX="slide"          # Optional, defaults to "slide"
export TARGET_PREFIX="cheatsheets"    # Optional, defaults to "cheatsheets"
```

## 🏗️ Architecture

### Flow Diagram

```
S3 Upload (slide/*)
    ↓
S3 Event Notification
    ↓
SQS Queue
    ↓
Lambda (main.py)
    ↓
SQSHandler (handlers/sqs_handler.py)
    ↓
S3Service (services/s3_service.py)
    ↓
Copy to cheatsheets/* + Tag
```

### Components

#### `main.py`
- Entry point for AWS Lambda
- Initializes handlers and configuration
- Global error handling

#### `handlers/sqs_handler.py`
- Processes SQS events
- Extracts S3 notifications
- Handles batch processing
- Returns partial batch failures

#### `services/s3_service.py`
- S3 file operations
- Content reading and logging
- File copying
- Tagging processed files

#### `utils/`
- `logger.py`: Logging configuration
- `s3_helpers.py`: Key transformation utilities

#### `config.py`
- Centralized configuration
- Environment variable management
- Configuration validation

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_s3_service.py

# Run with verbose output
pytest -v
```

## 🎯 Usage

### As Lambda Function

The Lambda handler is `src.main.handler`:

```python
from src.main import handler

# Lambda invocation
result = handler(event, context)
```

### Local Development

```python
from src.handlers.sqs_handler import SQSHandler

handler = SQSHandler()
result = handler.handle_event(mock_event)
```

## 📝 Code Style

### Format Code

```bash
# Format with black
black src/ tests/

# Lint with ruff
ruff check src/ tests/

# Type check with mypy
mypy src/
```

### Pre-commit Checks

```bash
# Run all checks
black src/ tests/ && ruff check src/ tests/ && mypy src/ && pytest
```

## 🐳 Deployment

### Package for Lambda

```bash
# Create deployment package
cd src
zip -r ../deployment.zip .

# Or use Terraform (automatically packages)
cd ../terraform
terraform apply
```

### Terraform Configuration

Update `terraform/modules/lambda/main.tf`:

```hcl
resource "aws_lambda_function" "s3_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.app_name}-s3-processor"
  handler          = "main.handler"  # Updated handler path
  runtime          = "python3.12"
  ...
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../cheatsheet-generator/src"  # Updated path
  output_path = "${path.module}/lambda_function.zip"
}
```

## 🔍 Monitoring

### CloudWatch Logs

```bash
# Tail logs
aws logs tail /aws/lambda/openexam-s3-processor --follow

# Filter by log level
aws logs tail /aws/lambda/openexam-s3-processor --filter-pattern "ERROR"
```

### Key Metrics

- **Invocations**: Number of Lambda executions
- **Errors**: Failed invocations
- **Duration**: Processing time per file
- **Throttles**: Rate-limited invocations

## 🐛 Troubleshooting

### Common Issues

**Import Errors**
```bash
# Ensure you're in the right directory
cd cheatsheet-generator
python -m pytest  # Use module syntax
```

**Type Check Failures**
```bash
# Run mypy with explicit path
mypy src/
```

**Test Failures**
```bash
# Run with verbose output
pytest -v -s
```

## 📚 Development Guidelines

### Adding New Features

1. Create/update service in `src/services/`
2. Add handler in `src/handlers/` if needed
3. Update configuration in `src/config.py`
4. Write tests in `tests/`
5. Update documentation

### Code Standards

- **Type Hints**: All functions must have type hints
- **Docstrings**: Public functions need docstrings
- **Testing**: Maintain >80% code coverage
- **Formatting**: Use black and ruff
- **Naming**: Follow PEP 8 conventions

## 🔐 Security

- No hardcoded credentials
- Use IAM roles for permissions
- Validate all inputs
- Sanitize file paths
- Log security events

## 📄 License

MIT License

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check CloudWatch logs for errors
- Review Terraform outputs for configuration


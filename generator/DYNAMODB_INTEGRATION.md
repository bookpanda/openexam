# DynamoDB Integration for Cheatsheet Generator

## Overview

The Lambda function now automatically saves cheatsheet metadata to DynamoDB when processing S3 uploads. Each uploaded file is assigned a unique ID and a random 6-character prefix for the filename.

## Architecture

```
S3 Upload (slide/userId/filename)
    ↓
SQS Queue
    ↓
Lambda Function
    ├─→ Generate random prefix (6 chars)
    ├─→ Copy to S3 (cheatsheets/userId/prefix_filename)
    └─→ Save metadata to DynamoDB
```

## File Processing Flow

### Input
- **S3 Path**: `slide/{userId}/{filename}`
- **Example**: `slide/user123/document.pdf`

### Output
1. **S3 Path**: `cheatsheets/{userId}/{randomPrefix}_{filename}`
   - **Example**: `cheatsheets/user123/f423e0_document.pdf`

2. **DynamoDB Record**:
   ```json
   {
     "id": "uuid-generated",
     "key": "f423e0_document.pdf",  // Just the prefixed filename
     "name": "document.pdf",         // Original filename
     "userId": "user123",
     "size": 1024,
     "contentType": "application/pdf",
     "createdAt": "2025-10-10T11:01:49+00:00",
     "updatedAt": "2025-10-10T11:01:49+00:00"
   }
   ```

## DynamoDB Schema

### Table: openexam-cheatsheets

**Primary Key**: `id` (String) - UUID generated for each cheatsheet

**Attributes**:
- `id`: Unique identifier (UUID)
- `key`: Prefixed filename (e.g., "abc123_file.pdf")
- `name`: Original filename without prefix
- `userId`: Owner's user ID
- `size`: File size in bytes
- `contentType`: MIME type
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

**Global Secondary Index (GSI)**: `KeyIndex`
- **Partition Key**: `key` (String)
- **Projection**: ALL
- **Use**: Fast lookup by prefixed filename

## Query Examples

### 1. Get cheatsheet by ID
```bash
aws dynamodb get-item \
  --table-name openexam-cheatsheets \
  --key '{"id": {"S": "ca38f0a3-5b09-426e-b818-b325c619065e"}}'
```

### 2. Query by prefixed filename (using GSI)
```bash
aws dynamodb query \
  --table-name openexam-cheatsheets \
  --index-name KeyIndex \
  --key-condition-expression "#key = :key" \
  --expression-attribute-names '{"#key":"key"}' \
  --expression-attribute-values '{":key":{"S":"f423e0_document.pdf"}}'
```

### 3. Scan for user's cheatsheets
```bash
aws dynamodb scan \
  --table-name openexam-cheatsheets \
  --filter-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"user123"}}'
```

## Python SDK Examples

### Query by key (GSI)
```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('openexam-cheatsheets')

response = table.query(
    IndexName='KeyIndex',
    KeyConditionExpression='#key = :key',
    ExpressionAttributeNames={'#key': 'key'},
    ExpressionAttributeValues={':key': 'f423e0_document.pdf'}
)

cheatsheet = response['Items'][0] if response['Items'] else None
```

### Get full S3 path
```python
def get_s3_path(cheatsheet: dict) -> str:
    """
    Construct full S3 path from cheatsheet metadata.
    
    Args:
        cheatsheet: DynamoDB item with userId and key
        
    Returns:
        Full S3 path (e.g., "cheatsheets/user123/f423e0_document.pdf")
    """
    return f"cheatsheets/{cheatsheet['userId']}/{cheatsheet['key']}"

# Usage
s3_path = get_s3_path(cheatsheet)
# Result: "cheatsheets/user123/f423e0_document.pdf"
```

## Lambda Environment Variables

```bash
BUCKET_NAME=openexam-545cd2ba24b23604
SOURCE_PREFIX=slide
TARGET_PREFIX=cheatsheets
CHEATSHEETS_TABLE_NAME=openexam-cheatsheets
MAX_CONTENT_PREVIEW_CHARS=500
MAX_BINARY_PREVIEW_BYTES=100
```

## IAM Permissions

The Lambda function has these DynamoDB permissions:
- `dynamodb:PutItem` - Save new cheatsheets
- `dynamodb:GetItem` - Retrieve by ID
- `dynamodb:Query` - Query by key (GSI)
- `dynamodb:UpdateItem` - Update metadata

Resources:
- `arn:aws:dynamodb:*:*:table/openexam-cheatsheets`
- `arn:aws:dynamodb:*:*:table/openexam-cheatsheets/index/*`

## Code Structure

### New Files
```
generator/src/
├── config.py                    # Added CHEATSHEETS_TABLE_NAME
├── services/
│   ├── dynamodb_service.py     # NEW: DynamoDB operations
│   └── s3_service.py           # Updated: Integrated DynamoDB
└── utils/
    └── s3_helpers.py           # Added: extract_user_id_and_name()

generator/tests/
└── test_extract_user_id.py     # NEW: Tests for path extraction
```

### Key Functions

#### `extract_user_id_and_name(key: str) -> tuple[str, str]`
Extracts user ID and filename from S3 key.

```python
# Input: "slide/user123/document.pdf"
# Output: ("user123", "document.pdf")

user_id, name = extract_user_id_and_name("slide/user123/document.pdf")
```

#### `DynamoDBService.save_cheatsheet()`
Saves cheatsheet metadata to DynamoDB.

```python
cheatsheet_id = dynamodb_service.save_cheatsheet(
    key="f423e0_document.pdf",      # Prefixed filename
    name="document.pdf",             # Original name
    user_id="user123",
    size=1024,
    content_type="application/pdf"
)
# Returns: UUID string
```

## Random Prefix Generation

The 6-character prefix is generated using `secrets.token_hex(3)`:
- Cryptographically secure random bytes
- 3 bytes = 6 hexadecimal characters
- Examples: `f423e0`, `14eed1`, `a8c9f2`

```python
import secrets

prefix = secrets.token_hex(3)  # e.g., "f423e0"
filename = f"{prefix}_{original_name}"  # e.g., "f423e0_document.pdf"
```

## Testing

### Manual Test
```bash
# Upload a file
echo "Test content" > /tmp/test.pdf
aws s3 cp /tmp/test.pdf \
  s3://openexam-545cd2ba24b23604/slide/user123/test.pdf

# Wait for processing (5-10 seconds)
sleep 10

# Check DynamoDB
aws dynamodb scan --table-name openexam-cheatsheets \
  --filter-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"user123"}}'

# Check S3
aws s3 ls s3://openexam-545cd2ba24b23604/cheatsheets/user123/
```

### Expected Results
1. File copied to `cheatsheets/user123/{prefix}_test.pdf`
2. DynamoDB record created with:
   - Unique `id` (UUID)
   - `key`: `{prefix}_test.pdf`
   - `name`: `test.pdf`
   - `userId`: `user123`

## Verification Results

### Test 1: user123/test-file.txt
```json
{
  "id": "ca38f0a3-5b09-426e-b818-b325c619065e",
  "key": "14eed1_test-file.txt",
  "name": "test-file.txt",
  "userId": "user123",
  "size": 49,
  "contentType": "text/plain",
  "createdAt": "2025-10-10T11:01:49.798770+00:00",
  "updatedAt": "2025-10-10T11:01:49.798770+00:00"
}
```

**S3 Path**: `s3://openexam-545cd2ba24b23604/cheatsheets/user123/14eed1_test-file.txt`

### Test 2: user456/document.pdf
```json
{
  "id": "456a57c2-f050-4a3d-830c-4df4098982d1",
  "key": "f423e0_document.pdf",
  "name": "document.pdf",
  "userId": "user456",
  "size": 35,
  "contentType": "application/pdf",
  "createdAt": "2025-10-10T11:03:18.937183+00:00",
  "updatedAt": "2025-10-10T11:03:18.937183+00:00"
}
```

**S3 Path**: `s3://openexam-545cd2ba24b23604/cheatsheets/user456/f423e0_document.pdf`

## Next Steps

1. **Add API Endpoints**:
   - `GET /cheatsheets` - List user's cheatsheets
   - `GET /cheatsheets/:id` - Get cheatsheet details
   - `DELETE /cheatsheets/:id` - Delete cheatsheet

2. **Query Optimization**:
   - Add GSI on `userId` for efficient user queries
   - Consider adding `createdAt` to sort key for chronological listing

3. **Frontend Integration**:
   - Update upload flow to display prefixed filename
   - Add cheatsheet management UI
   - Show file metadata from DynamoDB

4. **Monitoring**:
   - Track DynamoDB read/write metrics
   - Alert on Lambda errors
   - Monitor S3 storage costs

## Troubleshooting

### No DynamoDB records after upload
1. Check Lambda logs:
   ```bash
   aws logs tail /aws/lambda/openexam-s3-processor --since 10m
   ```

2. Verify SQS messages were processed:
   ```bash
   aws sqs get-queue-attributes \
     --queue-url https://sqs.ap-southeast-1.amazonaws.com/256097924934/openexam-queue \
     --attribute-names ApproximateNumberOfMessages
   ```

3. Check Lambda IAM permissions for DynamoDB

### Files not copying to cheatsheets/
1. Verify S3 source path starts with `slide/`
2. Check Lambda S3 permissions
3. Review Lambda logs for errors

### Invalid key format errors
The input must follow: `slide/{userId}/{filename}`
- ✅ Valid: `slide/user123/file.pdf`
- ❌ Invalid: `uploads/file.pdf`, `slide/file.pdf`

## Cost Estimation

### DynamoDB
- **Write requests**: 1 per file upload (~$1.43/million writes)
- **Storage**: ~500 bytes per record (~$0.25/GB/month)
- **Reads**: On-demand, charged per request

### Example: 10,000 uploads/month
- Writes: 10,000 × $0.00000143 = $0.014
- Storage: 10,000 × 500B = ~5MB = $0.001
- **Total**: ~$0.02/month

Very cost-effective for typical usage!


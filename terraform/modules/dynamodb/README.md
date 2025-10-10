# DynamoDB Tables Module

This module creates two DynamoDB tables for the OpenExam cheatsheet management system.

## Tables Created

### 1. Cheatsheets Table

**Table Name**: `openexam-cheatsheets`

**Primary Key**:
- **Partition Key (PK)**: `id` (String) - Unique identifier for each cheatsheet

**Global Secondary Index (GSI)**:
- **Index Name**: `KeyIndex`
- **Partition Key**: `key` (String) - S3 object key for fast lookups
- **Projection**: ALL (all attributes)

**Use Cases**:
- Store metadata about uploaded cheatsheets
- Query by S3 key to find cheatsheet information
- Track ownership and creation dates

**Example Item**:
```json
{
  "id": "uuid-123-456",
  "key": "abc123_document.pdf",
  "userId": "user-789",
  "name": "document.pdf",
  "createdAt": "2025-10-10T10:00:00Z",
  "size": 1048576,
  "contentType": "application/pdf"
}
```

**Access Patterns**:
1. **Get by ID**: `GetItem` on primary key
2. **Query by Key**: `Query` on `KeyIndex` GSI
3. **List all cheatsheets**: `Scan` (use sparingly)

### 2. Shares Table

**Table Name**: `openexam-shares`

**Primary Key**:
- **Partition Key (PK)**: `userId` (String) - User who has access
- **Sort Key (SK)**: `cheatsheetId` (String) - Cheatsheet being shared

**Global Secondary Index (GSI)**:
- **Index Name**: `CheatsheetIdIndex`
- **Partition Key**: `cheatsheetId` (String) - For reverse lookup
- **Projection**: ALL (all attributes)

**Use Cases**:
- Track which users have access to which cheatsheets
- Query all cheatsheets shared with a specific user
- Query all users who have access to a specific cheatsheet

**Example Item**:
```json
{
  "userId": "user-789",
  "cheatsheetId": "uuid-123-456",
  "sharedAt": "2025-10-10T10:00:00Z",
  "sharedBy": "user-456",
  "permission": "read"
}
```

**Access Patterns**:
1. **Get specific share**: `GetItem` on `userId` + `cheatsheetId`
2. **List user's shared cheatsheets**: `Query` on primary key with `userId`
3. **List users with access to cheatsheet**: `Query` on `CheatsheetIdIndex` GSI
4. **Check if user has access**: `GetItem` with composite key

## Features

### Billing Mode
- **PAY_PER_REQUEST** (On-Demand)
- No capacity planning required
- Automatically scales with demand
- Pay only for what you use

### Security
- **Server-Side Encryption**: Enabled by default
- **Point-in-Time Recovery**: Enabled for backup/restore
- **IAM Policy**: Included for access control

### Performance
- **Single-digit millisecond** latency
- **Automatic scaling** with on-demand mode
- **Global Secondary Indexes** for flexible queries

## IAM Policy

The module creates an IAM policy with permissions for:
- `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`
- `Query`, `Scan`
- `BatchGetItem`, `BatchWriteItem`
- Access to both tables and their GSIs

**Policy ARN Output**: `dynamodb_policy_arn`

## Usage

### Terraform

```hcl
module "dynamodb" {
  source      = "./modules/dynamodb"
  app_name    = "openexam"
  environment = "dev"
}
```

### AWS CLI Examples

#### Insert Item into Cheatsheets Table
```bash
aws dynamodb put-item \
  --table-name openexam-cheatsheets \
  --item '{
    "id": {"S": "uuid-123"},
    "key": {"S": "abc123_file.pdf"},
    "userId": {"S": "user-789"},
    "name": {"S": "file.pdf"},
    "createdAt": {"S": "2025-10-10T10:00:00Z"}
  }'
```

#### Query by S3 Key (using GSI)
```bash
aws dynamodb query \
  --table-name openexam-cheatsheets \
  --index-name KeyIndex \
  --key-condition-expression "#key = :keyVal" \
  --expression-attribute-names '{"#key": "key"}' \
  --expression-attribute-values '{":keyVal": {"S": "abc123_file.pdf"}}'
```

#### Share Cheatsheet with User
```bash
aws dynamodb put-item \
  --table-name openexam-shares \
  --item '{
    "userId": {"S": "user-456"},
    "cheatsheetId": {"S": "uuid-123"},
    "sharedAt": {"S": "2025-10-10T10:00:00Z"},
    "sharedBy": {"S": "user-789"}
  }'
```

#### Query All Cheatsheets Shared with User
```bash
aws dynamodb query \
  --table-name openexam-shares \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "user-456"}}'
```

#### Query All Users with Access to Cheatsheet (using GSI)
```bash
aws dynamodb query \
  --table-name openexam-shares \
  --index-name CheatsheetIdIndex \
  --key-condition-expression "cheatsheetId = :cheatsheetId" \
  --expression-attribute-values '{":cheatsheetId": {"S": "uuid-123"}}'
```

## Python (Boto3) Examples

```python
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')

# Reference tables
cheatsheets_table = dynamodb.Table('openexam-cheatsheets')
shares_table = dynamodb.Table('openexam-shares')

# Insert cheatsheet
cheatsheets_table.put_item(
    Item={
        'id': 'uuid-123',
        'key': 'abc123_file.pdf',
        'userId': 'user-789',
        'name': 'file.pdf',
        'createdAt': datetime.utcnow().isoformat()
    }
)

# Query by key using GSI
response = cheatsheets_table.query(
    IndexName='KeyIndex',
    KeyConditionExpression='#key = :key',
    ExpressionAttributeNames={'#key': 'key'},
    ExpressionAttributeValues={':key': 'abc123_file.pdf'}
)

# Share cheatsheet
shares_table.put_item(
    Item={
        'userId': 'user-456',
        'cheatsheetId': 'uuid-123',
        'sharedAt': datetime.utcnow().isoformat(),
        'sharedBy': 'user-789'
    }
)

# Get user's shared cheatsheets
response = shares_table.query(
    KeyConditionExpression='userId = :userId',
    ExpressionAttributeValues={':userId': 'user-456'}
)

# Check if user has access
response = shares_table.get_item(
    Key={
        'userId': 'user-456',
        'cheatsheetId': 'uuid-123'
    }
)
has_access = 'Item' in response
```

## Cost Estimation

### On-Demand Pricing (ap-southeast-1)
- **Write**: $1.4269 per million write request units
- **Read**: $0.2854 per million read request units
- **Storage**: $0.285 per GB-month

### Example Monthly Costs
- **10,000 writes/month**: ~$0.01
- **50,000 reads/month**: ~$0.01
- **1 GB storage**: ~$0.29
- **Total**: ~$0.31/month

### Free Tier (First 12 Months)
- 25 GB storage
- 25 write capacity units
- 25 read capacity units

## Monitoring

### CloudWatch Metrics
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors`
- `SystemErrors`
- `ThrottledRequests`

### View Metrics
```bash
# Read capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=openexam-cheatsheets \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Best Practices

### Data Modeling
1. **Use composite keys** for one-to-many relationships
2. **Create GSIs** for alternate access patterns
3. **Denormalize data** to reduce queries
4. **Use consistent naming** for partition keys

### Performance
1. **Avoid hot partitions** - distribute writes evenly
2. **Use batch operations** for multiple items
3. **Enable caching** with DAX if needed
4. **Monitor throttling** and adjust capacity

### Security
1. **Use IAM policies** for access control
2. **Enable encryption** at rest and in transit
3. **Enable Point-in-Time Recovery** for backups
4. **Use VPC endpoints** for private access

## Outputs

| Output | Description |
|--------|-------------|
| `cheatsheets_table_name` | Name of the cheatsheets table |
| `cheatsheets_table_arn` | ARN of the cheatsheets table |
| `shares_table_name` | Name of the shares table |
| `shares_table_arn` | ARN of the shares table |
| `dynamodb_policy_arn` | ARN of the IAM policy for DynamoDB access |

## Cleanup

To delete the tables:
```bash
terraform destroy -target=module.dynamodb
```

**Warning**: This will permanently delete all data in the tables!

## References

- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Boto3 DynamoDB Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb.html)


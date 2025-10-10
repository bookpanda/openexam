# Lambda S3 Event Processor

## Architecture Overview

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│   S3    │─────>│   SQS   │─────>│ Lambda  │─────>│ Process │
│ Upload  │      │  Queue  │      │Function │      │  Logic  │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
```

### Flow:
1. **File Upload**: User uploads a file to S3 bucket
2. **S3 Notification**: S3 sends an event notification to SQS queue
3. **SQS Message**: Message is queued for processing
4. **Lambda Trigger**: Lambda automatically polls SQS and processes messages in batches
5. **Processing**: Lambda function executes your custom logic
6. **Cleanup**: Lambda deletes the message from SQS after successful processing

## Resources Created

### Lambda Function
- **Name**: `openexam-s3-processor`
- **Runtime**: Node.js 20.x
- **Memory**: 256 MB
- **Timeout**: 60 seconds
- **Trigger**: SQS queue (batch size: 10 messages)

### IAM Permissions
Lambda has permissions to:
- Read messages from SQS queue
- Delete messages from SQS queue  
- Get objects from S3 bucket
- Write logs to CloudWatch

### CloudWatch Logs
- **Log Group**: `/aws/lambda/openexam-s3-processor`
- **Retention**: 7 days

## Testing the Setup

### 1. Upload a file to S3

**Using AWS CLI:**
```bash
aws s3 cp test-file.txt s3://openexam-545cd2ba24b23604/test-file.txt
```

**Using Go service:**
```bash
curl -X POST http://localhost:3000/upload \
  -H "X-User-Id: 6531319021" \
  -F "file=@test-file.txt"
```

### 2. Check Lambda Logs

```bash
# View recent logs
aws logs tail /aws/lambda/openexam-s3-processor --follow

# Or use AWS Console
# Navigate to: CloudWatch > Log groups > /aws/lambda/openexam-s3-processor
```

### 3. Monitor SQS Queue

```bash
# Check queue metrics
aws sqs get-queue-attributes \
  --queue-url https://sqs.ap-southeast-1.amazonaws.com/256097924934/openexam-queue \
  --attribute-names All
```

## Lambda Function Code

The Lambda function is located at: `modules/lambda/lambda_function.js`

### Current Implementation
- Parses S3 events from SQS messages
- Logs file information (bucket, key, size, timestamp)
- Supports partial batch failures (failed messages are automatically retried)

### Customizing the Function

Edit `modules/lambda/lambda_function.js` to add your processing logic:

```javascript
// Example: Process uploaded files
const s3Event = body.Records[0];
const bucket = s3Event.s3.bucket.name;
const key = decodeURIComponent(s3Event.s3.object.key.replace(/\+/g, ' '));

// Add your custom logic here:
// - Generate thumbnails for images
// - Extract text from PDFs using AWS Textract
// - Update database records
// - Send notifications
// - Call external APIs
```

After modifying the function:

```bash
cd terraform
terraform apply
```

## Configuration

### Adjust Lambda Settings

Edit `modules/lambda/main.tf`:

```hcl
resource "aws_lambda_function" "s3_processor" {
  timeout     = 60      # Increase if processing takes longer
  memory_size = 256     # Increase for memory-intensive operations
  runtime     = "nodejs20.x"  # Change to python3.x, go1.x, etc.
}
```

### Adjust SQS Batch Size

Edit `modules/lambda/main.tf`:

```hcl
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  batch_size = 10  # Process up to 10 messages per invocation
}
```

### Adjust Visibility Timeout

Edit `modules/sqs/main.tf`:

```hcl
resource "aws_sqs_queue" "cheatsheet_queue" {
  visibility_timeout_seconds = 360  # Should be >= Lambda timeout * 6
}
```

## Error Handling

### Failed Messages
- Lambda reports failed messages back to SQS
- Failed messages are automatically retried
- After max retries, messages can be sent to a Dead Letter Queue (DLQ)

### Adding a Dead Letter Queue

Add to `modules/sqs/main.tf`:

```hcl
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.app_name}-dlq"
  message_retention_seconds = 1209600  # 14 days
}

resource "aws_sqs_queue" "cheatsheet_queue" {
  # ... existing config ...
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3  # Retry 3 times before sending to DLQ
  })
}
```

## Monitoring

### CloudWatch Metrics to Watch
- **Lambda Invocations**: Number of times function is invoked
- **Lambda Errors**: Number of failed invocations
- **Lambda Duration**: Execution time per invocation
- **SQS ApproximateNumberOfMessagesVisible**: Messages waiting in queue
- **SQS ApproximateAgeOfOldestMessage**: Time oldest message has been in queue

### Setting Up Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name openexam-lambda-errors \
  --alarm-description "Alert when Lambda has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=openexam-s3-processor
```

## Cost Optimization

### Lambda Costs
- **Free Tier**: 1M requests/month, 400,000 GB-seconds compute
- **After Free Tier**: $0.20 per 1M requests + $0.0000166667 per GB-second

### SQS Costs
- **Free Tier**: 1M requests/month
- **After Free Tier**: $0.40 per 1M requests

### Tips
- Increase batch size to process more messages per invocation
- Set appropriate retention periods on CloudWatch logs
- Use Lambda reserved concurrency to limit costs

## Troubleshooting

### Lambda not triggering
1. Check SQS queue has messages: `aws sqs get-queue-attributes`
2. Check Lambda event source mapping is enabled
3. Check IAM permissions

### Messages stuck in queue
1. Check Lambda errors in CloudWatch Logs
2. Increase Lambda timeout if processing takes too long
3. Check visibility timeout is appropriate

### High costs
1. Review CloudWatch metrics for invocation count
2. Check for infinite retry loops
3. Implement DLQ to catch persistent failures

## Outputs

After deployment, Terraform provides:

```
lambda_function_name = "openexam-s3-processor"
lambda_function_arn  = "arn:aws:lambda:ap-southeast-1:256097924934:function:openexam-s3-processor"
queue_name           = "openexam-queue"
queue_url            = "https://sqs.ap-southeast-1.amazonaws.com/256097924934/openexam-queue"
bucket_name          = "openexam-545cd2ba24b23604"
```

## Clean Up

To destroy all resources:

```bash
cd terraform
terraform destroy
```

## References

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/)
- [Lambda-SQS Integration](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)


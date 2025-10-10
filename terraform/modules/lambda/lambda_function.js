/**
 * Lambda function to process S3 upload events from SQS
 * This function is triggered when files are uploaded to S3
 */

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      // Parse the S3 event from SQS message
      const body = JSON.parse(record.body);
      const s3Event = body.Records[0];
      
      const bucket = s3Event.s3.bucket.name;
      const key = decodeURIComponent(s3Event.s3.object.key.replace(/\+/g, ' '));
      const size = s3Event.s3.object.size;
      const eventName = s3Event.eventName;

      console.log(`Processing ${eventName} for file: ${key}`);
      console.log(`Bucket: ${bucket}, Size: ${size} bytes`);

      // TODO: Add your processing logic here
      // Examples:
      // - Generate thumbnails for images
      // - Extract text from PDFs
      // - Validate file types
      // - Update database records
      // - Send notifications
      
      // Example: Log file information
      console.log('File uploaded successfully:', {
        bucket,
        key,
        size,
        timestamp: s3Event.eventTime
      });

      // If processing is successful, continue to next record
      // If there's an error, it will be caught and added to failures

    } catch (error) {
      console.error('Error processing record:', error);
      
      // Add failed message to batch item failures
      // This tells SQS to retry only the failed messages
      batchItemFailures.push({
        itemIdentifier: record.messageId
      });
    }
  }

  // Return batch item failures for partial batch responses
  return {
    batchItemFailures: batchItemFailures
  };
};


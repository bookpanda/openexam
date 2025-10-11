#!/bin/bash
set -e

echo "🚀 Deploying Lambda Functions with Dependencies"
echo "================================================"

# Check for required environment variable
if [ -z "$TF_VAR_gemini_api_key" ]; then
    echo "❌ Error: TF_VAR_gemini_api_key environment variable is not set"
    echo "Please export your Gemini API key:"
    echo "  export TF_VAR_gemini_api_key=\"your-api-key-here\""
    exit 1
fi

# Step 1: Build Lambda packages
echo ""
echo "📦 Step 1: Building Lambda packages with dependencies..."
cd generator
./build_lambda.sh
cd ..

# Step 2: Apply Terraform
echo ""
echo "🏗️  Step 2: Deploying to AWS with Terraform..."
cd terraform
terraform apply -auto-approve

# Step 3: Get outputs
echo ""
echo "📊 Step 3: Deployment Complete!"
echo "================================"
BUCKET=$(terraform output -raw bucket_name 2>/dev/null || echo "N/A")
REQUEST_QUEUE=$(terraform output -raw sqs_request_queue_url 2>/dev/null || echo "N/A")
RESPONSE_QUEUE=$(terraform output -raw sqs_response_queue_url 2>/dev/null || echo "N/A")

echo "✅ Bucket: $BUCKET"
echo "✅ Request Queue: $REQUEST_QUEUE"
echo "✅ Response Queue: $RESPONSE_QUEUE"


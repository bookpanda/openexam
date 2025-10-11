#!/bin/bash
set -e

echo "🔨 Building Lambda deployment packages..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
mkdir -p build/lambda_package

# Install dependencies using Docker for Linux compatibility
echo "📦 Installing Python dependencies (Linux x86_64)..."
docker run --rm \
  --platform linux/amd64 \
  --entrypoint "" \
  -v "$PWD":/var/task \
  -w /var/task \
  public.ecr.aws/lambda/python:3.12 \
  pip install -r requirements.txt -t build/lambda_package/ --quiet

# Copy source code
echo "📁 Copying source code..."
cp -r src/* build/lambda_package/

# Create zip file
echo "🗜️  Creating deployment package..."
cd build/lambda_package
zip -r ../lambda_function.zip . -q
cd ../..

echo "✅ Lambda package built: build/lambda_function.zip"
echo "📊 Package size: $(du -h build/lambda_function.zip | cut -f1)"

# Copy to terraform module
echo "📋 Copying to Terraform module..."
cp build/lambda_function.zip ../terraform/modules/lambda/tracker_function.zip
cp build/lambda_function.zip ../terraform/modules/lambda/generator_function.zip

echo "✅ Build complete!"


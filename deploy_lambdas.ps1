# PowerShell script for deploying Lambda functions with dependencies on Windows
# Requires Docker Desktop and Terraform to be installed

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Lambda Functions with Dependencies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check for required environment variable
if (-not $env:TF_VAR_gemini_api_key) {
    Write-Host "❌ Error: TF_VAR_gemini_api_key environment variable is not set" -ForegroundColor Red
    Write-Host "Please set your Gemini API key:" -ForegroundColor Yellow
    Write-Host '  $env:TF_VAR_gemini_api_key = "your-api-key-here"' -ForegroundColor Yellow
    exit 1
}

# Step 1: Build Lambda packages
Write-Host ""
Write-Host "📦 Step 1: Building Lambda packages with dependencies..." -ForegroundColor Cyan
Set-Location "generator"
& .\build_lambda.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Set-Location ".."

# Step 2: Apply Terraform
Write-Host ""
Write-Host "🏗️  Step 2: Deploying to AWS with Terraform..." -ForegroundColor Cyan
Set-Location "terraform"
terraform apply -auto-approve
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform apply failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Step 3: Get outputs
Write-Host ""
Write-Host "📊 Step 3: Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

try {
    $bucket = terraform output -raw bucket_name 2>$null
    if (-not $bucket) { $bucket = "N/A" }
} catch {
    $bucket = "N/A"
}

try {
    $requestQueue = terraform output -raw sqs_request_queue_url 2>$null
    if (-not $requestQueue) { $requestQueue = "N/A" }
} catch {
    $requestQueue = "N/A"
}

try {
    $responseQueue = terraform output -raw sqs_response_queue_url 2>$null
    if (-not $responseQueue) { $responseQueue = "N/A" }
} catch {
    $responseQueue = "N/A"
}

Write-Host "✅ Bucket: $bucket" -ForegroundColor Green
Write-Host "✅ Request Queue: $requestQueue" -ForegroundColor Green
Write-Host "✅ Response Queue: $responseQueue" -ForegroundColor Green

Set-Location ".."


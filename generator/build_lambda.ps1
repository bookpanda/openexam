# PowerShell script for building Lambda deployment packages on Windows
# Requires Docker Desktop for Windows to be running

$ErrorActionPreference = "Stop"

Write-Host "🔨 Building Lambda deployment packages..." -ForegroundColor Cyan

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
New-Item -ItemType Directory -Force -Path "build/lambda_package" | Out-Null

# Install dependencies using Docker for Linux compatibility
Write-Host "📦 Installing Python dependencies (Linux x86_64)..." -ForegroundColor Yellow
docker run --rm `
  --platform linux/amd64 `
  --entrypoint "" `
  -v "${PWD}:/var/task" `
  -w /var/task `
  public.ecr.aws/lambda/python:3.12 `
  pip install -r requirements.txt -t build/lambda_package/ --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

# Copy source code
Write-Host "📁 Copying source code..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "src/*" "build/lambda_package/"

# Create zip file
Write-Host "🗜️  Creating deployment package..." -ForegroundColor Yellow
Set-Location "build/lambda_package"
Compress-Archive -Path * -DestinationPath "../lambda_function.zip" -Force
Set-Location "../.."

Write-Host "✅ Lambda package built: build/lambda_function.zip" -ForegroundColor Green
$size = (Get-Item "build/lambda_function.zip").Length / 1MB
Write-Host ("📊 Package size: {0:N2} MB" -f $size) -ForegroundColor Green

# Copy to terraform module
Write-Host "📋 Copying to Terraform module..." -ForegroundColor Yellow
Copy-Item -Force "build/lambda_function.zip" "../terraform/modules/lambda/tracker_function.zip"
Copy-Item -Force "build/lambda_function.zip" "../terraform/modules/lambda/generator_function.zip"

Write-Host "✅ Build complete!" -ForegroundColor Green


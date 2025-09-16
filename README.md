# openexam

## Stack

-   gateway (rust): axum, tonic
-   user (rust): tonic, postgres
-   cheatsheet (go): s3, dynamodb, rabbitmq
-   cheatsheet-generator (python): openai-api, rabbitmq
-   frontend (typescript): nextjs, tailwindcss

## Getting Started

### Running all serviceslocally via docker compose
this will run lastest images of all services
1. pull images used in `docker-compose.yml`
```bash
# arm64 e.g. mac m1
docker pull --platform=linux/arm64 ghcr.io/bookpanda/openexam-gateway:latest
docker pull --platform=linux/arm64 ghcr.io/bookpanda/openexam-user:latest

# amd64 e.g. x86_64
docker pull ghcr.io/bookpanda/openexam-gateway:latest
docker pull ghcr.io/bookpanda/openexam-user:latest
```
2. Copy `.env.template` and paste it in the same directory as `.env`. Fill in the appropriate values.
3. Run `docker compose up -d` to start the services.

### Running services on the host
- used when you need to make code changes to some services
- you can comment out that service in root `docker-compose.yml` while working (but don't commit it)
1. Copy `.env.template` and paste it in the same directory as `.env` for that service. Fill in the appropriate values.
2. Follow the instructions in the service's README.md to run the service.

## API
When run locally, the gateway url will be available at `localhost:3001`.
- Swagger UI: `http://127.0.0.1:3001/swagger/`

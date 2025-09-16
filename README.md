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
1. Copy `.env.template` and paste it in the same directory as `.env`. Fill in the appropriate values.
2. Run `docker compose up -d` to start the services.

### Running services on the host
- used when you need to make code changes to some services
- you can comment out that service in root `docker-compose.yml` while working (but don't commit it)
1. Copy `.env.template` and paste it in the same directory as `.env` for that service. Fill in the appropriate values.
2. Follow the instructions in the service's README.md to run the service.

## API
When run locally, the gateway url will be available at `localhost:3001`.
- Swagger UI: `localhost:3001/api/v1/docs/index.html#/`
- Grafana: `localhost:3006` (username: admin, password: 1234)
- Prometheus: `localhost:9090`
- Gateway's metrics endpoint: `localhost:3001/metrics`

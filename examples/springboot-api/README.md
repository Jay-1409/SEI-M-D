# Spring Boot Example API Service

This is a sample Java Spring Boot backend with a Dockerfile, designed to demonstrate a microservice with a variety of REST APIs for use with the Secure Microservice Deployer.

## Features
- Multiple REST endpoints (CRUD for users, products, orders, etc.)
- OpenAPI (Swagger) documentation
- Health check endpoint
- Ready for containerization

## Usage
- Build the Docker image:
  ```sh
  docker build -t springboot-api-example .
  ```
- Run the container:
  ```sh
  docker run -p 8080:8080 springboot-api-example
  ```
- Access the API at http://localhost:8080
- Swagger UI at http://localhost:8080/swagger-ui.html

## Endpoints
- `/api/users` (CRUD)
- `/api/products` (CRUD)
- `/api/orders` (CRUD)
- `/api/health` (health check)

---
This example is for demonstration and testing purposes.

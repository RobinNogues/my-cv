# my-cv-frontend

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    container_name: cv_frontend
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    container_name: cv_backend
    restart: unless-stopped
    env_file:
      - .env

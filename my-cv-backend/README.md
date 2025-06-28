# My CV Backend

This project is the backend service for my personal CV/portfolio website. It is built with Python and the FastAPI framework.

## Features

- Handles contact form submissions.
- Honeypot protection.
- Clean the received data to avoid code injection.
- Built with modern Python and FastAPI.

## Installation

### Prerequisites

- Docker
- Create a Google app password (you can check this tutorial: https://www.youtube.com/watch?v=ZfEK3WP73eY)

### Install

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd my-cv-backend
    ```

2.  **Configure environment variables:**
    Rename `.env.template` to `.env` file and put your own credentials.


3.  **Install the API:**
    In the root folder, do:
    ```bash
    docker compose up -d --build
    ```

## API Documentation

FastAPI provides automatic interactive API documentation. Once the server is running, you can access it at:

-   **Swagger UI:** `http://localhost:8000/docs`
-   **ReDoc:** `http://localhost:8000/redoc`

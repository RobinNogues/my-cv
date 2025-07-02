# Personal CV Website - robin-nogues.com

This repository contains the source code for my personal CV and portfolio website, live at [robin-nogues.com](https://robin-nogues.com/).

It is designed to showcase my skills, experience, and projects in a clean, modern, and responsive interface. The project is built with a microservice architecture, separating the frontend and backend concerns.

## ✨ Features

-   **Fully Responsive:** Optimized for desktops, tablets, and mobile devices.
-   **Comprehensive Sections:** Includes Professional Experience, Personal Projects, Skills, Education, and Certifications.
-   **Interactive UI:** Features smooth scrolling, active navigation link highlighting, and a "Back to Top" button.
-   **Contact Form:** A secure contact form with backend processing, input validation, and anti-spam (honeypot, API Rate Limiting) protection.
-   **Automated Deployment:** CI/CD pipeline for automated builds and deployments to a live server.

## 🏗️ Architecture & Tech Stack

The project follows a microservice architecture, containerized and orchestrated with Docker and Docker Compose.

-   **Frontend (`my-cv-frontend`):**
    -   **Languages:** HTML, CSS, JavaScript
    -   **Frameworks/Libraries:** TailwindCSS for styling.
    -   **Purpose:** Serves the static website content.

-   **Backend (`my-cv-backend`):**
    -   **Language:** Python
    -   **Framework:** FastAPI
    -   **Purpose:** Handles contact form submissions, including data validation, sanitization, and sending emails.

-   **Infrastructure & DevOps:**
    -   **Web Server/Reverse Proxy:** Nginx acts as a reverse proxy and API Gateway, routing traffic to the appropriate service (`/api/*` to backend, others to frontend) and handling security.
    -   **Containerization:** Docker & Docker Compose for creating consistent and isolated environments for each service.
    -   **SSL/TLS:** Certbot for managing Let's Encrypt SSL certificates, with automated renewal via a cron job.
    -   **CI/CD:** GitHub Actions automates building Docker images and deploying the application to the VPS on every push to the `main` branch.
    -   **Hosting:** Deployed on a Virtual Private Server (VPS).

## 🚀 Getting Started

To run this project locally, you need Docker and Docker Compose installed.

### 1. Clone the Repository

```bash
git clone https://github.com/RobinNogues/my-cv.git
cd my-cv
```

### 2. Configure Backend Environment

The backend requires environment variables to send emails via the contact form.

Navigate to the backend directory, copy the environment template, and fill in your credentials.

```bash
cd my-cv-backend
cp .env.template .env
```

Now, edit the `.env` file with your email provider's details. For Gmail, you would need to create a Google App Password.
If you don't use the Google SMTP server, you will need to change default server and port in the `EmailSender` instanciation.

### 3. Create Local SSL Certificate (for HTTPS)

To run the project with HTTPS locally, you need a self-signed SSL certificate.

1.  Go to the directory for the certificates:

    ```bash
    cd reverse-proxy/local_certs
    ```

2.  Generate the certificate and private key using OpenSSL:

    ```bash
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout reverse-proxy/local_certs/nginx.key \
        -out reverse-proxy/local_certs/nginx.crt
    ```

    You will be prompted for some information. You can leave most fields blank by pressing Enter. For the "Common Name", it's important to use `localhost`.

### 4. Build and Run

From the **root directory** of the project (`my-cv/`), run the following command to build the images and start the services:

```bash
docker-compose up --build -d
```

The docker-compose.override.yml needs to be used for the local installation.

### 5. Access the Website

The website should now be running and accessible at https://localhost. Nginx will serve the frontend and proxy API requests to the backend.

The front will also be accessible at http://localhost:8081 if you don't want to use HTTPS, but the form won't work.

## 📚 API Documentation

The FastAPI backend provides automatic interactive API documentation. Once the services are running, you can access it via the Nginx proxy:

-   **Swagger UI:** http://localhost:8000/api/docs
-   **ReDoc:** http://localhost:8000/api/redoc

## 📦 Production Deployment

These steps are for setting up the application on a production server with a live domain and enabling HTTPS with Let's Encrypt.

**Prerequisites:**
- Your domain's DNS A/AAAA record (`my-website.com`) must point to your VPS IP address.
- The project files are on your VPS.
- You have created the backend `.env` file as described in the "Getting Started" section.

### 1. Initial Certificate Generation

This is a one-time command to obtain your SSL certificates.

1.  Start all services:
    ```bash
    docker compose up -d
    ```
    Your Nginx service should now be running and serving a basic HTTP site on port 80, which is required for the Certbot challenge.

2.  Run Certbot to generate the certificate. Replace `your-email@example.com` with your actual email.
    ```bash
    docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
        -d robin-nogues.com \
        --email your-email@example.com \
        --agree-tos \
        --no-eff-email
    ```

3.  Once the certificate is successfully created, restart the reverse proxy to load the new SSL configuration:
    ```bash
    docker compose restart reverse-proxy
    ```
    Your site should now be accessible via `https://my-website.com`.

### 2. Automating Certificate Renewal

Let's Encrypt certificates expire every 90 days. The renewal process should be automated. The CI/CD pipeline in this project (`.github/workflows/deploy.yml`) already adds the necessary cron job to your server automatically during deployment.

For manual setup or reference, the command to add to your crontab is below. This job runs daily, attempts renewal, and reloads Nginx if a new certificate was obtained.

1.  Open the crontab editor: `crontab -e`
2.  Add the following line, replacing `/path/to/your/project` with the absolute path to your project's root directory on the VPS. It will try to renew the certificat every day at 4:17 AM.
    ```
    17 4 * * * cd /path/to/your/project && /usr/bin/docker compose run --rm certbot renew --quiet && /usr/bin/docker kill --signal=SIGHUP cv_reverse_proxy >> /path/to/your/project/cron-certbot.log 2>&1
    ```

## 🤝 Contributions and Security

I am always open to hearing suggestions for improvements or if you identify any potential security vulnerabilities. Please feel free to open an issue, submit a pull request on the GitHub repository or contact me directly. Your feedback is highly valued!

## 📜 License

This project is licensed under the MIT License.

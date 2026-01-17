# Personal CV Website - robin-nogues.com

This repository contains the source code for my personal CV and portfolio website, live at [robin-nogues.com](https://robin-nogues.com/).

It is designed to showcase my skills, experience, and projects in a clean, modern, and responsive interface. The project is built with a microservice architecture, separating the frontend and backend concerns.

## ✨ Features

-   **Fully Responsive:** Optimized for desktops, tablets, and mobile devices.
-   **Comprehensive Sections:** Includes Professional Experience, Personal Projects, Skills, Education, and Certifications.
-   **Interactive UI:** Dark mode, smooth animations, active navigation link highlighting, animated burger menu and a "Back to Top" button.
-   **Combats Spam:** A secure contact form with backend processing, input validation, and anti-spam (honeypot, API Rate Limiting) protection.
-   **Privacy-Focused Analytics:** Self-hosted analytics with GoatCounter, providing traffic statistics without tracking cookies or sharing data with third parties (GDPR compliant).
-   **Automated Deployment:** CI/CD pipeline for automated builds and deployments to a live server.

## 🏗️ Architecture & Tech Stack

The project follows a microservice architecture, containerized and orchestrated with Docker and Docker Compose.

```mermaid
flowchart TB
    Internet["🌐 Internet (HTTPS:443)"]
    
    subgraph Docker["Docker Compose"]
        ReverseProxy["🔀 Reverse Proxy<br/>(Nginx)<br/>SSL • Routing • Security"]
        Frontend["📄 Frontend<br/>(Nginx)"]
        Backend["⚙️ Backend<br/>(FastAPI)"]
        Analytics["📊 Analytics<br/>(GoatCounter)"]
    end
    
    Internet --> ReverseProxy
    ReverseProxy --> Frontend
    ReverseProxy --> Backend
    ReverseProxy --> Analytics
```

### Services

| Service | Technology | Purpose |
|---------|------------|---------|
| **Frontend** | HTML, CSS, JavaScript, [Nginx](https://nginx.org/) | Static website content |
| **Backend** | Python, [FastAPI](https://fastapi.tiangolo.com/) | Contact form handling, validation, email sending |
| **Reverse Proxy** | [Nginx](https://nginx.org/) | SSL termination, routing, security headers, rate limiting |
| **Analytics** | [GoatCounter](https://www.goatcounter.com/) | Privacy-focused, cookie-free traffic analytics |
| **Certbot** | [Let's Encrypt](https://letsencrypt.org/) / [Certbot](https://certbot.eff.org/) | Automated SSL certificate management |

### Infrastructure & DevOps

- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (auto-deploy on push to `main`)
- **Hosting:** Virtual Private Server (VPS)

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

Now, edit the `.env` file with your email provider's details.

> [!CAUTION]
> **Never use your real email password!** Create a dedicated App Password for this application. This is a unique password generated specifically for third-party apps, which you can revoke at any time without affecting your main account.

If you want to use a different SMTP server (e.g., Outlook, ProtonMail), uncomment and modify `SMTP_SERVER` and `SMTP_PORT` in the `.env` file.

### 3. Create Local SSL Certificate (for HTTPS)

To run the project with HTTPS locally, you need a self-signed SSL certificate.

Generate the certificate and private key using OpenSSL:


```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout reverse-proxy/local_certs/nginx.key \
    -out reverse-proxy/local_certs/nginx.crt \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:stats.localhost"
```

### 4. Configure Analytics (First Time Only)

After building and running the services, you need to create the GoatCounter site:

```bash
docker exec -it cv_goatcounter goatcounter db create site \
  -vhost=stats.localhost \
  -user.email=your@email.com \
  -password=yourpassword
```

This creates the analytics site with your login credentials.

### 5. Build and Run

From the **root directory** of the project (`my-cv/`), run the following command to build the images and start the services:

```bash
docker-compose up --build -d
```

The docker-compose.override.yml needs to be used for the local installation.

### 6. Access the Website

The website should now be running and accessible at https://localhost. Nginx will serve the frontend and proxy API requests to the backend.

-   **Website:** https://localhost
-   **Analytics:** https://stats.localhost (login with email/password from step 4)

The front will also be accessible at http://localhost:8081 if you don't want to use HTTPS, but the form won't work.

## 📚 API Documentation

The FastAPI backend provides automatic interactive API documentation. Once the services are running, you can access it directly:

-   **Swagger UI:** http://localhost:8000/docs
-   **ReDoc:** http://localhost:8000/redoc

## 📦 Production Deployment

These steps are for setting up the application on a production server with a live domain and enabling HTTPS with Let's Encrypt.

**Prerequisites:**
- Your domain's DNS A/AAAA records (`my-website.com`, `www.my-website.com`, `stats.my-website.com`) must point to your VPS IP address.
- You have created the backend `.env` file as described in the "Getting Started" section.

**Deployment options:**
- **Manual:** Copy project files to your VPS and run `docker compose up -d`
- **Container registry:** Push images to a registry (GitHub, Docker Hub, etc.) and pull them on your VPS
- **Automated CI/CD:** Set up a pipeline (like the included GitHub Actions workflow) for automatic deployments

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
        -d my-website.com \
        -d www.my-website.com \
        -d stats.my-website.com \
        --email your-email@example.com \
        --agree-tos \
        --no-eff-email
    ```

3.  Once the certificate is successfully created, restart the reverse proxy to load the new SSL configuration:
    ```bash
    docker compose restart reverse-proxy
    ```
    Your site should now be accessible via `https://my-website.com`.

### 2. Configure Analytics

Create the GoatCounter site with your credentials:

```bash
docker exec -it cv_goatcounter goatcounter db create site \
  -vhost=stats.my-website.com \
  -user.email=your@email.com
```

You will be prompted to set a password. The analytics dashboard will be available at `https://stats.my-website.com`.

### 3. Automating Certificate Renewal

Let's Encrypt certificates expire every 90 days. The renewal process should be automated.

You can do it with a cron job. This job will run daily, attempts renewal, and reloads Nginx if a new certificate was obtained.

1.  Open the crontab editor: `crontab -e`
2.  Add the following line, replacing `/path/to/your/project` with the absolute path to your project's root directory on the VPS. It will try to renew the certificate every day at 4:17 AM.
```bash
17 4 * * * /bin/bash /path/to/your/project/scripts/renew-certs.sh
```

## 🤝 Contributions and Security

I am always open to hearing suggestions for improvements or if you identify any potential security vulnerabilities. Please feel free to open an issue, submit a pull request on the GitHub repository or contact me directly. Your feedback is highly valued!

## 📜 License

This project is licensed under the MIT License.

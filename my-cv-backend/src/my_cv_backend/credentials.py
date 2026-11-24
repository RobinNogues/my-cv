from os import environ

EMAIL = environ["EMAIL"]
EMAIL_PASSWORD = environ["EMAIL_PASS"]
SMTP_SERVER = environ.get("SMTP_SERVER") or "smtp.gmail.com"
SMTP_PORT = int(environ.get("SMTP_PORT") or "465")
DOMAIN = environ.get("DOMAIN") or "localhost"
ENVIRONMENT = environ.get("ENVIRONMENT") or "production"

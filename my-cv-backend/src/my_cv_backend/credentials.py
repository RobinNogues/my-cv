from os import environ


EMAIL = environ["EMAIL"]
EMAIL_PASSWORD = environ["EMAIL_PASS"]
SMTP_SERVER = environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(environ.get("SMTP_PORT", "465"))
DOMAIN = environ.get("DOMAIN", "localhost")

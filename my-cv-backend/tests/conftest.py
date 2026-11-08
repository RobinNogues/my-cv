import os

# Set dummy environment variables for test execution before app modules import credentials
os.environ.setdefault("EMAIL", "test-receiver@example.com")
os.environ.setdefault("EMAIL_PASS", "dummy-app-password")
os.environ.setdefault("DOMAIN", "localhost")
os.environ.setdefault("SMTP_SERVER", "smtp.example.com")
os.environ.setdefault("SMTP_PORT", "465")

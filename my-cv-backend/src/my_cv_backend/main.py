from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .credentials import DOMAIN, EMAIL, ENVIRONMENT
from .email_sender import EMAIL_SENDER, format_content
from .logger import logger
from .middleware import RateLimitMiddleware
from .models import ContactForm

_IS_DEV = ENVIRONMENT == "development"

app = FastAPI(
    title="CV Contact Form API",
    description="API that send an email to Robin NOGUES when someone uses the contact form",
    version="1.0.0",
    docs_url="/docs" if _IS_DEV else None,
    redoc_url="/redoc" if _IS_DEV else None,
    openapi_url="/openapi.json" if _IS_DEV else None,
)

app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"https://{DOMAIN}",
        f"https://www.{DOMAIN}",
        "http://localhost",
        "https://localhost",
        "http://localhost:8081",
        "http://127.0.0.1",
        "http://127.0.0.1:8081",
    ],
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """
    Lightweight healthcheck endpoint for container orchestration.

    Returns
    -------
    dict[str, str]
        Service health status.
    """
    return {"status": "ok"}


@app.post("/api/contact", status_code=status.HTTP_200_OK)
async def submit_contact_form(form_data: ContactForm) -> dict[str, str]:
    """
    Validate and dispatch a contact form submission via SMTP.

    Parameters
    ----------
    form_data : ContactForm
        Validated contact form payload.

    Returns
    -------
    dict[str, str]
        Confirmation message.

    Raises
    ------
    HTTPException
        If email dispatch fails.
    """
    if form_data.address:
        # Return identical success payload to avoid giving bots clues
        return {"message": "Message sent successfully."}

    content = format_content(form_data.message, form_data.name, form_data.email)

    try:
        await EMAIL_SENDER.send(EMAIL, form_data.subject, content, form_data.email)

    except Exception as e:
        logger.exception("Error sending contact form email")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while trying to send the email.",
        ) from e

    logger.info("Contact form email sent successfully.")
    return {"message": "Message sent successfully."}

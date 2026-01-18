from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .credentials import DOMAIN, EMAIL
from .email_sender import EMAIL_SENDER, format_content
from .logger import logger
from .middleware import RateLimitMiddleware
from .models import ContactForm

app = FastAPI(
    title="CV Contact Form API",
    description="API that send an email to Robin NOGUES when someone uses the contact form",
    version="1.0.0",
)

app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"https://{DOMAIN}",
        f"https://www.{DOMAIN}",
        "http://localhost",
        "http://localhost:8080",
        "http://127.0.0.1",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.post("/api/contact", status_code=status.HTTP_200_OK)
async def submit_contact_form(form_data: ContactForm):
    if form_data.address:
        # Return a success response to avoid giving bots clues
        raise HTTPException(status_code=status.HTTP_200_OK, detail="Invalid request.")

    name = form_data.name.strip()
    email = form_data.email.strip()
    subject = form_data.subject.strip()
    message = form_data.message.strip()

    content = format_content(message, name, email)

    try:
        await EMAIL_SENDER.send(EMAIL, subject, content, email)

    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while trying to send the email.",
        )

    logger.info(f"Email sent successfully from {email} with subject '{subject}'")
    return {"message": "Message sent successfully."}

from fastapi import FastAPI, HTTPException, status

import re

from .credentials import EMAIL
from .email_sender import EMAIL_SENDER, format_content
from .logger import logger
from .models import ContactForm


app = FastAPI(
    title="CV Contact Form API",
    description="API that send an email to Robin NOGUES when someone uses the contact form",
    version="1.0.0"
)


@app.post("/api/contact", status_code=status.HTTP_200_OK)
async def submit_contact_form(form_data: ContactForm):
    
    if form_data.address:
        # Return a success response to avoid giving bots clues
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Invalid request."
        )
    name = sanitize_input(form_data.name)
    email = sanitize_input(form_data.email)
    subject = sanitize_input(form_data.subject)
    message = sanitize_input(form_data.message)
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
    return {"message": "Message received successfully."}


def sanitize_input(text: str) -> str:
    """
    Sanitizes a string to reduce injection risks.
    Removes potentially dangerous characters.
    """
    text = re.sub(r'<[^>]*>', '', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    return text.strip()

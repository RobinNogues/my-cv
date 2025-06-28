from pydantic import BaseModel, EmailStr, Field


class ContactForm(BaseModel):
    """Model for the contact form data."""
    name: str = Field(min_length=2, max_length=100, description="Name of the sender")
    email: EmailStr = Field(description="Email address of the sender")
    subject: str = Field(max_length=200, description="Email subject")
    message: str = Field(min_length=10, description="Message content")
    address: str = Field("", description="Honeypot field (must be empty for humans)")

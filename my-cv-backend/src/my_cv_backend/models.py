from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactForm(BaseModel):
    """Model for the contact form data."""

    name: str = Field(min_length=2, max_length=100, description="Name of the sender")
    email: EmailStr = Field(description="Email address of the sender")
    subject: str = Field(min_length=1, max_length=200, description="Email subject")
    message: str = Field(min_length=10, max_length=10000, description="Message content")
    address: str = Field(
        "", exclude=True, description="Honeypot field (must be empty for humans)"
    )

    @field_validator("subject", "name")
    @classmethod
    def sanitize_single_line(cls, v: str) -> str:
        """
        Sanitize single-line text inputs to prevent CRLF injection.

        Parameters
        ----------
        v : str
            Raw text input.

        Returns
        -------
        str
            Sanitized single-line string.

        Raises
        ------
        ValueError
            If the field is empty or contains only whitespace.
        """
        clean = " ".join(v.splitlines()).strip()
        if not clean:
            raise ValueError("Field cannot be empty or whitespace only.")
        return clean

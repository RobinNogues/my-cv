from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactForm(BaseModel):
    """Model for the contact form data."""

    name: str = Field(min_length=2, max_length=100, description="Name of the sender")
    email: EmailStr = Field(description="Email address of the sender")
    subject: str = Field(min_length=1, max_length=200, description="Email subject")
    message: str = Field(min_length=10, max_length=10000, description="Message content")
    address: str = Field(
        default="",
        exclude=True,
        description="Honeypot field (must be empty for humans)",
    )

    @field_validator("subject", "name", mode="before")
    @classmethod
    def sanitize_single_line(cls, v: object) -> object:
        """
        Sanitize single-line text inputs to prevent CRLF injection before length checks.

        Parameters
        ----------
        v : object
            Raw text input.

        Returns
        -------
        object
            Sanitized single-line string, or the original value for Pydantic type checking.

        Raises
        ------
        ValueError
            If the field is empty or contains only whitespace.
        """
        if not isinstance(v, str):
            return v
        clean = " ".join(v.splitlines()).strip()
        if not clean:
            raise ValueError("Field cannot be empty or whitespace only.")
        return clean

    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, v: object) -> object:
        """
        Strip leading and trailing whitespace from message before length validation.

        Parameters
        ----------
        v : object
            Raw message input.

        Returns
        -------
        object
            Trimmed message string, or the original value for Pydantic type checking.
        """
        if isinstance(v, str):
            return v.strip()
        return v

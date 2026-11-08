import pytest
from pydantic import ValidationError

from my_cv_backend.models import ContactForm


def test_valid_contact_form() -> None:
    """
    Test ContactForm initialization with valid data.

    Returns
    -------
    None
    """
    form = ContactForm(
        name="John Doe",
        email="john.doe@example.com",
        subject="Project Inquiry",
        message="Hello, I would like to discuss a job opportunity.",
    )
    assert form.name == "John Doe"
    assert form.email == "john.doe@example.com"
    assert form.subject == "Project Inquiry"
    assert form.message == "Hello, I would like to discuss a job opportunity."
    assert form.address == ""


def test_crlf_sanitization() -> None:
    """
    Test that CRLF line breaks in single-line fields are normalized to spaces.

    Returns
    -------
    None
    """
    form = ContactForm(
        name="John\r\nDoe",
        email="john.doe@example.com",
        subject="Project\nInquiry\r\nBcc: evil@test.com",
        message="Valid message content for testing.",
    )
    assert form.name == "John Doe"
    assert form.subject == "Project Inquiry Bcc: evil@test.com"


@pytest.mark.parametrize(
    "invalid_data",
    [
        {
            "name": "J",
            "email": "john.doe@example.com",
            "subject": "Valid",
            "message": "Valid long message",
        },
        {
            "name": "John Doe",
            "email": "invalid-email",
            "subject": "Valid",
            "message": "Valid long message",
        },
        {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "subject": "",
            "message": "Valid long message",
        },
        {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "subject": "\r\n  \n",
            "message": "Valid long message",
        },
        {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "subject": "Valid",
            "message": "short",
        },
    ],
)
def test_invalid_contact_form(invalid_data: dict[str, str]) -> None:
    """
    Test that invalid fields raise Pydantic ValidationError.

    Parameters
    ----------
    invalid_data : dict[str, str]
        Form payload containing an invalid field.

    Returns
    -------
    None
    """
    with pytest.raises(ValidationError):
        ContactForm(**invalid_data)


def test_honeypot_field_presence() -> None:
    """
    Test honeypot address field assignment and serialization exclusion.

    Returns
    -------
    None
    """
    form = ContactForm(
        name="Bot User",
        email="bot@example.com",
        subject="Spam",
        message="Buy our product right now please.",
        address="http://spam-link.com",
    )
    assert form.address == "http://spam-link.com"
    dump = form.model_dump()
    assert "address" not in dump

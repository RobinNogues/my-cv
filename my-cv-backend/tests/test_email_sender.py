from unittest.mock import AsyncMock, patch

import pytest

from my_cv_backend.email_sender import EmailSender, format_content


def test_format_content() -> None:
    """
    Test format_content string output.

    Returns
    -------
    None
    """
    body = format_content(
        text="Interested in your background.",
        form_visitor_name="John Doe",
        form_visitor_email="john.doe@example.com",
    )
    assert "Name: John Doe" in body
    assert "Email: john.doe@example.com" in body
    assert "Interested in your background." in body


@pytest.mark.asyncio
async def test_email_sender_send_successful() -> None:
    """
    Test EmailSender.send when SMTP connection and authentication succeed.

    Returns
    -------
    None
    """
    sender = EmailSender(
        email_address="sender@example.com",
        app_password="secretpassword",
        smtp_server="smtp.example.com",
        smtp_port=465,
    )

    mock_client = AsyncMock()
    mock_client.login = AsyncMock()
    mock_client.send_message = AsyncMock()

    with patch("my_cv_backend.email_sender.SMTP") as mock_smtp_class:
        mock_smtp_class.return_value.__aenter__.return_value = mock_client

        await sender.send(
            to="recipient@example.com",
            subject="Test Subject",
            text="Test body content.",
            reply_to="reply@example.com",
        )

        mock_smtp_class.assert_called_once_with(
            hostname="smtp.example.com",
            port=465,
            use_tls=True,
            timeout=10.0,
        )
        mock_client.login.assert_awaited_once_with(
            "sender@example.com", "secretpassword"
        )
        mock_client.send_message.assert_awaited_once()

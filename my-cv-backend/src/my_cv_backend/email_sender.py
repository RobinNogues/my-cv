from email.mime.text import MIMEText
from email.header import Header
from typing import Optional

from aiosmtplib import SMTP

from .credentials import GOOGLE_EMAIL, GOOGLE_PASSWORD
from .logger import logger


class EmailSender:
    """
    A class to send emails via SMTP using a SMTP server.

    This class handles the connection, authentication, and sending of email messages,
    including the ability to set a 'Reply-To' header for contact forms.

    """

    def __init__(
            self,
            email_address: str,
            app_password: str,
            smtp_server: str = "smtp.gmail.com",
            smtp_port: int = 465,
    ) -> None:
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.email_address = email_address
        self.app_password = app_password

    async def send(
            self,
            to: str,
            subject: str,
            text: str,
            reply_to: Optional[str] = None,
    ) -> None:
        """
        Sends an email asynchronously using the initialized SMTP configuration.

        Parameters
        ----------
        to : str
            The email address of the recipient.
        subject : str
            The subject line of the email.
        text : str
            The plain text body of the email message.
        reply_to : str
            The email address to which replies should be directed.

        """
        reply_to = reply_to or to
        msg = MIMEText(text, "plain", "utf-8")
        msg["From"] = Header(self.email_address, "utf-8")
        msg["To"] = Header(to, "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["Reply-To"] = Header(reply_to, "utf-8")
        
        async with SMTP(
            hostname=self.smtp_server,
            port=self.smtp_port,
            use_tls=True,
        ) as client:
            # Authentification
            await client.login(self.email_address, self.app_password)

            # Envoi de l'e-mail
            await client.send_message(msg)

        logger.info("Email sent successfully.")


def format_content(text: str, form_visitor_name: str, form_visitor_email: str) -> str:
    """
    Generate the content of the email message.

    Parameters
    ----------
    text : str
        The plain text body of the email message.
    form_visitor_name : str
        The name of the form visitor.
    form_visitor_email : str
        The email of the form visitor.
    
    Returns
    -------
    str
        The formatted content of the email message.

    """
    return (
        "New message received via your contact form:\n\n"
        f"Name: {form_visitor_name}\n"
        f"Email: {form_visitor_email}\n\n"
        "Message:\n"
        "---\n"
        f"{text}"
    )


EMAIL_SENDER = EmailSender(
    email_address=GOOGLE_EMAIL,
    app_password=GOOGLE_PASSWORD,
)

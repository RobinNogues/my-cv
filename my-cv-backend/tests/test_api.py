from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from my_cv_backend.main import app
from my_cv_backend.middleware import _storage, get_real_ip


@pytest.fixture(autouse=True)
def reset_rate_limiter_storage() -> None:
    """
    Reset rate limiter in-memory storage before each test.

    Returns
    -------
    None
    """
    _storage.reset()


@pytest.fixture
def client() -> TestClient:
    """
    Create a FastAPI TestClient instance.

    Returns
    -------
    TestClient
        Test client for FastAPI app.
    """
    return TestClient(app)


def test_submit_contact_form_success(client: TestClient) -> None:
    """
    Test successful form submission returning HTTP 200 and sending an email.

    Parameters
    ----------
    client : TestClient
        FastAPI test client fixture.

    Returns
    -------
    None
    """
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "subject": "Interview Request",
        "message": "We would like to schedule a technical interview.",
    }

    with patch(
        "my_cv_backend.main.EMAIL_SENDER.send", new_callable=AsyncMock
    ) as mock_send:
        response = client.post(
            "/api/contact", json=payload, headers={"X-Forwarded-For": "198.51.100.1"}
        )

        assert response.status_code == 200
        assert response.json() == {"message": "Message sent successfully."}
        mock_send.assert_awaited_once()


def test_submit_contact_form_honeypot(client: TestClient) -> None:
    """
    Test honeypot rejection returning HTTP 200 without sending an email.

    Parameters
    ----------
    client : TestClient
        FastAPI test client fixture.

    Returns
    -------
    None
    """
    payload = {
        "name": "Spam Bot",
        "email": "bot@example.com",
        "subject": "Promo",
        "message": "Check out this promotional link here.",
        "address": "https://malicious-spam.com",
    }

    with patch(
        "my_cv_backend.main.EMAIL_SENDER.send", new_callable=AsyncMock
    ) as mock_send:
        response = client.post(
            "/api/contact", json=payload, headers={"X-Forwarded-For": "198.51.100.2"}
        )

        assert response.status_code == 200
        assert response.json() == {"detail": "Invalid request."}
        mock_send.assert_not_awaited()


def test_submit_contact_form_validation_error(client: TestClient) -> None:
    """
    Test that invalid schema payloads return HTTP 422.

    Parameters
    ----------
    client : TestClient
        FastAPI test client fixture.

    Returns
    -------
    None
    """
    payload = {
        "name": "",
        "email": "invalid-email-string",
        "subject": "Hi",
        "message": "short",
    }

    response = client.post(
        "/api/contact", json=payload, headers={"X-Forwarded-For": "198.51.100.3"}
    )
    assert response.status_code == 422


def test_submit_contact_form_smtp_failure(client: TestClient) -> None:
    """
    Test that SMTP communication failures return HTTP 500.

    Parameters
    ----------
    client : TestClient
        FastAPI test client fixture.

    Returns
    -------
    None
    """
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "subject": "Job Offer",
        "message": "We have an open position matching your profile.",
    }

    with patch(
        "my_cv_backend.main.EMAIL_SENDER.send", new_callable=AsyncMock
    ) as mock_send:
        mock_send.side_effect = ConnectionError("SMTP Connection Timeout")
        response = client.post(
            "/api/contact", json=payload, headers={"X-Forwarded-For": "198.51.100.4"}
        )

        assert response.status_code == 500
        assert response.json() == {
            "detail": "An error occurred while trying to send the email."
        }


def test_submit_contact_form_rate_limiting(client: TestClient) -> None:
    """
    Test that the rate limiter returns HTTP 429 after 10 requests within a minute.

    Parameters
    ----------
    client : TestClient
        FastAPI test client fixture.

    Returns
    -------
    None
    """
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "subject": "Inquiry",
        "message": "Testing the rate limiter window.",
    }

    test_ip = "203.0.113.42"

    with patch("my_cv_backend.main.EMAIL_SENDER.send", new_callable=AsyncMock):
        # 10 allowed requests
        for _ in range(10):
            res = client.post(
                "/api/contact", json=payload, headers={"X-Forwarded-For": test_ip}
            )
            assert res.status_code == 200

        # 11th request triggers rate limit
        res_blocked = client.post(
            "/api/contact", json=payload, headers={"X-Forwarded-For": test_ip}
        )
        assert res_blocked.status_code == 429
        assert res_blocked.json() == {
            "detail": "Too many requests. Please try again later."
        }


def test_get_real_ip_fallback() -> None:
    """
    Test get_real_ip fallback behaviors when X-Forwarded-For header is missing.

    Returns
    -------
    None
    """
    request_with_client = MagicMock()
    request_with_client.headers = {}
    request_with_client.client.host = "192.168.1.1"
    assert get_real_ip(request_with_client) == "192.168.1.1"

    request_without_client = MagicMock()
    request_without_client.headers = {}
    request_without_client.client = None
    assert get_real_ip(request_without_client) == "unknown"


def test_rate_limit_middleware_ignores_unmatched_routes_and_methods(
    client: TestClient,
) -> None:
    """
    Test that the rate limit middleware bypasses non-POST requests and other paths.

    Parameters
    ----------
    client : TestClient
        FastAPI test client fixture.

    Returns
    -------
    None
    """
    response_get_contact = client.get("/api/contact")
    assert response_get_contact.status_code == 405

    response_docs = client.get("/docs")
    assert response_docs.status_code == 200

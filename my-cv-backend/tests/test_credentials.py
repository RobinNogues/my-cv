import importlib

import pytest

from my_cv_backend import credentials


def test_credentials_empty_smtp_port_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    Test that an empty SMTP_PORT environment variable falls back to 465.

    Parameters
    ----------
    monkeypatch : pytest.MonkeyPatch
        Pytest monkeypatch fixture.

    Returns
    -------
    None
    """
    monkeypatch.setenv("SMTP_PORT", "")
    try:
        importlib.reload(credentials)
        assert credentials.SMTP_PORT == 465
    finally:
        monkeypatch.undo()
        importlib.reload(credentials)

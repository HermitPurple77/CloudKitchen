# conftest.py – root-level pytest fixtures for CloudKitchen (Express backend)

import pytest
import httpx


@pytest.fixture
def api_client():
    """HTTP client to talk to your Express backend."""
    with httpx.Client(
        base_url="http://localhost:3000",
        timeout=10.0,
        headers={"Content-Type": "application/json"},
    ) as client:
        yield client

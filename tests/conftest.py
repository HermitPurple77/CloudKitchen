# conftest.py – Express backend + Staff Dashboard fixtures
import pytest
import httpx
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

@pytest.fixture
def api_client():
    """HTTP client for Express API endpoints."""
    with httpx.Client(
        base_url="http://localhost:3000",
        timeout=10.0,
        headers={"Content-Type": "application/json"},
    ) as client:
        yield client

@pytest.fixture(scope="session")
def selenium_driver():
    """Chrome driver for Staff Directory E2E tests."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()

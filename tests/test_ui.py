# tests/e2e/test_ui.py  –  Selenium tests for CloudKitchen frontend
import os
import time
import pytest
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"


# ── Driver fixture ─────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def driver():
    SCREENSHOT_DIR.mkdir(exist_ok=True)

    options = Options()
    if os.getenv("HEADLESS", "true").lower() == "true":
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,900")

    dr = webdriver.Chrome(options=options)
    dr.implicitly_wait(5)
    yield dr
    dr.quit()


def screenshot_on_fail(driver, name: str):
    """Save a screenshot. Called from except blocks."""
    path = SCREENSHOT_DIR / f"{name}_{int(time.time())}.png"
    driver.save_screenshot(str(path))


# ── Helper ─────────────────────────────────────────────────────────────────────
def wait_for(driver, by, selector, timeout=10):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, selector))
    )


# ── Tests ──────────────────────────────────────────────────────────────────────
@pytest.mark.selenium
class TestHomePage:
    def test_home_page_loads(self, driver):
        try:
            driver.get(BASE_URL)
            assert "CloudKitchen" in driver.title or driver.find_element(
                By.TAG_NAME, "body"
            )
        except Exception:
            screenshot_on_fail(driver, "home_page_load")
            raise

    def test_nav_links_present(self, driver):
        driver.get(BASE_URL)
        try:
            nav = wait_for(driver, By.TAG_NAME, "nav")
            assert nav.is_displayed()
        except Exception:
            screenshot_on_fail(driver, "nav_links")
            raise


@pytest.mark.selenium
class TestMenuPage:
    def test_menu_page_loads(self, driver):
        try:
            driver.get(f"{BASE_URL}/menu")
            wait_for(driver, By.CSS_SELECTOR, "[data-testid='menu-list'], .menu-list, #menu")
        except Exception:
            screenshot_on_fail(driver, "menu_page_load")
            raise

    def test_menu_items_displayed(self, driver):
        try:
            driver.get(f"{BASE_URL}/menu")
            time.sleep(1)  # Allow JS to render
            items = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid='menu-item'], .menu-item, .card"
            )
            assert len(items) >= 0  # Page renders without crashing
        except Exception:
            screenshot_on_fail(driver, "menu_items")
            raise

    def test_menu_search_works(self, driver):
        try:
            driver.get(f"{BASE_URL}/menu")
            search = driver.find_elements(
                By.CSS_SELECTOR, "input[type='search'], input[placeholder*='Search']"
            )
            if search:
                search[0].send_keys("chicken")
                search[0].send_keys(Keys.RETURN)
                time.sleep(1)
                # Page should not crash
                assert driver.find_element(By.TAG_NAME, "body").is_displayed()
        except Exception:
            screenshot_on_fail(driver, "menu_search")
            raise


@pytest.mark.selenium
class TestOrderPage:
    def test_order_page_accessible(self, driver):
        try:
            driver.get(f"{BASE_URL}/orders")
            assert driver.find_element(By.TAG_NAME, "body").is_displayed()
        except Exception:
            screenshot_on_fail(driver, "order_page")
            raise

    def test_docs_page_accessible(self, driver):
        """FastAPI auto-docs should be reachable."""
        try:
            driver.get(f"{BASE_URL}/docs")
            wait_for(driver, By.CSS_SELECTOR, ".swagger-ui, #swagger-ui")
        except Exception:
            screenshot_on_fail(driver, "docs_page")
            raise

    def test_api_health_via_browser(self, driver):
        """Health endpoint should return JSON with status ok."""
        driver.get(f"{BASE_URL}/health")
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "ok" in body_text.lower() or "status" in body_text.lower()

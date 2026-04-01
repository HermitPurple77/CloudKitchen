# tests/conftest.py  –  shared fixtures for CloudKitchen
# The Express/Node API runs as a real server; tests hit it over HTTP via requests.
import os
import pytest
import requests

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# ── Session-level: verify the server is reachable ────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def assert_server_running():
    """Fail fast with a clear message if the Express server isn't up."""
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        r.raise_for_status()
    except Exception as exc:
        pytest.exit(
            f"\n❌  Cannot reach API server at {BASE_URL}\n"
            f"    Start it with: cd backend && node server.js\n"
            f"    Error: {exc}",
            returncode=1,
        )


# ── Convenience HTTP helpers ──────────────────────────────────────────────────
@pytest.fixture(scope="session")
def api():
    """Returns a small helper object with get/post/patch/delete methods."""

    class API:
        base = BASE_URL

        def get(self, path, **kw):
            return requests.get(f"{self.base}{path}", **kw)

        def post(self, path, **kw):
            return requests.post(f"{self.base}{path}", **kw)

        def patch(self, path, **kw):
            return requests.patch(f"{self.base}{path}", **kw)

        def delete(self, path, **kw):
            return requests.delete(f"{self.base}{path}", **kw)

    return API()


# ── Sample data fixtures ──────────────────────────────────────────────────────
@pytest.fixture()
def sample_menu_item():
    return {
        "name": "Butter Chicken",
        "description": "Classic creamy curry",
        "price": 299.0,
        "category": "main_course",
        "isAvailable": True,
    }


@pytest.fixture()
def sample_order(api, sample_menu_item):
    """Creates a menu item first, returns a valid order payload referencing it."""
    resp = api.post("/api/menu", json=sample_menu_item)
    assert resp.status_code in (200, 201), f"Setup failed: {resp.text}"
    menu_id = resp.json().get("id") or resp.json().get("_id")

    return {
        "customerName": "Test User",
        "customerEmail": "test@cloudkitchen.com",
        "items": [{"menuItemId": menu_id, "quantity": 2}],
        "deliveryAddress": "123 Test Street, Bengaluru",
    }

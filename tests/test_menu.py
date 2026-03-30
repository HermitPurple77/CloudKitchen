# tests/unit/test_menu.py  –  unit tests for menu endpoints
import pytest


class TestMenuEndpoints:
    """Unit tests for /menu routes."""

    def test_get_menu_returns_200(self, client):
        response = client.get("/menu")
        assert response.status_code == 200

    def test_get_menu_returns_list(self, client):
        response = client.get("/menu")
        data = response.json()
        assert isinstance(data, list)

    def test_create_menu_item_success(self, client, sample_menu_item):
        response = client.post("/menu", json=sample_menu_item)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_menu_item["name"]
        assert data["price"] == sample_menu_item["price"]
        assert "id" in data

    def test_create_menu_item_missing_name(self, client):
        response = client.post("/menu", json={"price": 100.0})
        assert response.status_code == 422  # Unprocessable Entity

    def test_create_menu_item_negative_price(self, client, sample_menu_item):
        bad_item = {**sample_menu_item, "price": -50.0}
        response = client.post("/menu", json=bad_item)
        assert response.status_code == 422

    def test_get_menu_item_by_id(self, client, sample_menu_item):
        # Create first
        create_resp = client.post("/menu", json=sample_menu_item)
        item_id = create_resp.json()["id"]
        # Then fetch
        response = client.get(f"/menu/{item_id}")
        assert response.status_code == 200
        assert response.json()["id"] == item_id

    def test_get_nonexistent_menu_item(self, client):
        response = client.get("/menu/99999")
        assert response.status_code == 404

    def test_update_menu_item(self, client, sample_menu_item):
        create_resp = client.post("/menu", json=sample_menu_item)
        item_id = create_resp.json()["id"]
        update_data = {"price": 349.0, "is_available": False}
        response = client.patch(f"/menu/{item_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["price"] == 349.0

    def test_delete_menu_item(self, client, sample_menu_item):
        create_resp = client.post("/menu", json=sample_menu_item)
        item_id = create_resp.json()["id"]
        response = client.delete(f"/menu/{item_id}")
        assert response.status_code == 204
        # Confirm it's gone
        get_resp = client.get(f"/menu/{item_id}")
        assert get_resp.status_code == 404


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

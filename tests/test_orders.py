# tests/unit/test_orders.py  –  unit tests for order endpoints
import pytest


class TestOrderEndpoints:
    """Unit tests for /orders routes."""

    def _create_menu_item(self, client, sample_menu_item):
        resp = client.post("/menu", json=sample_menu_item)
        assert resp.status_code == 201
        return resp.json()["id"]

    def test_create_order_success(self, client, sample_menu_item, sample_order):
        menu_id = self._create_menu_item(client, sample_menu_item)
        order = {**sample_order, "items": [{"menu_item_id": menu_id, "quantity": 2}]}
        response = client.post("/orders", json=order)
        assert response.status_code == 201
        data = response.json()
        assert data["customer_name"] == sample_order["customer_name"]
        assert data["status"] == "pending"
        assert "id" in data

    def test_create_order_empty_items(self, client, sample_order):
        bad_order = {**sample_order, "items": []}
        response = client.post("/orders", json=bad_order)
        assert response.status_code == 422

    def test_get_order_by_id(self, client, sample_menu_item, sample_order):
        menu_id = self._create_menu_item(client, sample_menu_item)
        order = {**sample_order, "items": [{"menu_item_id": menu_id, "quantity": 1}]}
        create_resp = client.post("/orders", json=order)
        order_id = create_resp.json()["id"]

        response = client.get(f"/orders/{order_id}")
        assert response.status_code == 200
        assert response.json()["id"] == order_id

    def test_get_nonexistent_order(self, client):
        response = client.get("/orders/99999")
        assert response.status_code == 404

    def test_update_order_status(self, client, sample_menu_item, sample_order):
        menu_id = self._create_menu_item(client, sample_menu_item)
        order = {**sample_order, "items": [{"menu_item_id": menu_id, "quantity": 1}]}
        create_resp = client.post("/orders", json=order)
        order_id = create_resp.json()["id"]

        response = client.patch(
            f"/orders/{order_id}/status", json={"status": "confirmed"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "confirmed"

    def test_invalid_status_transition(self, client, sample_menu_item, sample_order):
        menu_id = self._create_menu_item(client, sample_menu_item)
        order = {**sample_order, "items": [{"menu_item_id": menu_id, "quantity": 1}]}
        create_resp = client.post("/orders", json=order)
        order_id = create_resp.json()["id"]

        # "delivered" → "pending" should be rejected
        client.patch(f"/orders/{order_id}/status", json={"status": "delivered"})
        response = client.patch(
            f"/orders/{order_id}/status", json={"status": "pending"}
        )
        assert response.status_code == 400

    def test_list_orders(self, client):
        response = client.get("/orders")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

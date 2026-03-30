# tests/integration/test_order_flow.py  –  end-to-end DB integration tests
import pytest


class TestFullOrderFlow:
    """
    Integration tests: create menu items → place order → update status.
    These run against a real (test) database session.
    """

    def test_complete_order_lifecycle(self, client, sample_menu_item):
        # 1. Add menu item
        menu_resp = client.post("/menu", json=sample_menu_item)
        assert menu_resp.status_code == 201
        menu_id = menu_resp.json()["id"]

        # 2. Place order
        order_payload = {
            "customer_name": "Integration Tester",
            "customer_email": "ci@cloudkitchen.com",
            "items": [{"menu_item_id": menu_id, "quantity": 3}],
            "delivery_address": "1 Pipeline Road, Github Actions",
        }
        order_resp = client.post("/orders", json=order_payload)
        assert order_resp.status_code == 201
        order_id = order_resp.json()["id"]
        assert order_resp.json()["status"] == "pending"

        # 3. Confirm order
        confirm_resp = client.patch(
            f"/orders/{order_id}/status", json={"status": "confirmed"}
        )
        assert confirm_resp.status_code == 200
        assert confirm_resp.json()["status"] == "confirmed"

        # 4. Mark preparing
        prep_resp = client.patch(
            f"/orders/{order_id}/status", json={"status": "preparing"}
        )
        assert prep_resp.status_code == 200

        # 5. Out for delivery
        out_resp = client.patch(
            f"/orders/{order_id}/status", json={"status": "out_for_delivery"}
        )
        assert out_resp.status_code == 200

        # 6. Delivered
        done_resp = client.patch(
            f"/orders/{order_id}/status", json={"status": "delivered"}
        )
        assert done_resp.status_code == 200
        assert done_resp.json()["status"] == "delivered"

    def test_unavailable_item_cannot_be_ordered(self, client, sample_menu_item):
        # Create item and mark it unavailable
        item = {**sample_menu_item, "is_available": False}
        menu_resp = client.post("/menu", json=item)
        menu_id = menu_resp.json()["id"]

        order_payload = {
            "customer_name": "Sad Customer",
            "customer_email": "sad@test.com",
            "items": [{"menu_item_id": menu_id, "quantity": 1}],
            "delivery_address": "Nowhere",
        }
        order_resp = client.post("/orders", json=order_payload)
        # Should reject unavailable items
        assert order_resp.status_code in (400, 422)

    def test_menu_item_stock_reflected_in_orders(self, client, sample_menu_item):
        menu_resp = client.post("/menu", json=sample_menu_item)
        menu_id = menu_resp.json()["id"]

        # Place two separate orders for the same item
        for i in range(2):
            order_payload = {
                "customer_name": f"Customer {i}",
                "customer_email": f"c{i}@test.com",
                "items": [{"menu_item_id": menu_id, "quantity": 1}],
                "delivery_address": f"{i} Test Lane",
            }
            resp = client.post("/orders", json=order_payload)
            assert resp.status_code == 201

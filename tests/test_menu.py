def test_get_menu(api_client):
    resp = api_client.get("/menu")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data or "menu" in data  # adapt to your actual JSON shape

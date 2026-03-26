from __future__ import annotations

from fastapi.testclient import TestClient

from conftest import load_module


gateway_main = load_module("backend/gateway/main.py", "gateway_main_tests")


def test_detect_sqli_positive():
    is_bad, desc = gateway_main.detect_sqli("id=1 OR 1=1")
    assert is_bad is True
    assert desc


def test_detect_xss_positive():
    is_bad, desc = gateway_main.detect_xss("<script>alert(1)</script>")
    assert is_bad is True
    assert "script" in desc.lower()


def test_check_headers_blocks_invalid_content_type():
    blocked, reason, _desc, stripped = gateway_main.check_headers(
        {"content-type": "application/evil", "x-forwarded-host": "attacker"},
        "POST",
    )
    assert blocked is True
    assert "Disallowed Content-Type" in reason
    assert "x-forwarded-host" in [h.lower() for h in stripped]


def test_register_and_list_routes(monkeypatch):
    class DummyRedis:
        def __init__(self):
            self.store = {}

        def set(self, key, value):
            self.store[key] = value

        def delete(self, key):
            self.store.pop(key, None)

    dummy_redis = DummyRedis()
    monkeypatch.setattr(gateway_main, "_get_redis", lambda: dummy_redis)
    gateway_main.route_table.clear()

    client = TestClient(gateway_main.app)
    resp = client.post("/register", json={"service_name": "svc", "target_url": "http://svc:8080"})
    assert resp.status_code == 200
    assert gateway_main.route_table["svc"] == "http://svc:8080"

    resp = client.get("/routes")
    assert resp.status_code == 200
    assert resp.json()["svc"] == "http://svc:8080"

    resp = client.delete("/register/svc")
    assert resp.status_code == 200
    assert "svc" not in gateway_main.route_table


def test_health_endpoint():
    client = TestClient(gateway_main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

from __future__ import annotations

from fastapi.testclient import TestClient

from conftest import load_module


deployer_main = load_module("backend/deployer/main.py", "deployer_main_tests")


class DummyRedis:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value):
        self.store[key] = value

    def delete(self, key):
        self.store.pop(key, None)


def test_normalize_proxy_base_url_validation():
    assert deployer_main._normalize_proxy_base_url("https://abc.trycloudflare.com/") == "https://abc.trycloudflare.com"

    try:
        deployer_main._normalize_proxy_base_url("abc.trycloudflare.com")
        assert False, "Expected HTTPException for missing scheme"
    except Exception as e:
        assert "http://" in str(e) or "https://" in str(e)


def test_proxy_url_endpoints_roundtrip(monkeypatch):
    dummy_redis = DummyRedis()
    monkeypatch.setattr(deployer_main, "redis_client", dummy_redis)
    monkeypatch.setattr(deployer_main, "DEFAULT_PROXY_BASE_URL", "")

    client = TestClient(deployer_main.app)

    resp = client.get("/services/pay-s/proxy-url")
    assert resp.status_code == 200
    assert resp.json()["proxy_url"] is None

    resp = client.post(
        "/services/pay-s/proxy-url",
        json={"base_url": "https://abc.trycloudflare.com"},
    )
    assert resp.status_code == 200
    assert resp.json()["proxy_url"] == "https://abc.trycloudflare.com/pay-s"

    resp = client.get("/services/pay-s/proxy-url")
    assert resp.status_code == 200
    assert resp.json()["source"] == "service"

    resp = client.delete("/services/pay-s/proxy-url")
    assert resp.status_code == 200
    assert resp.json()["proxy_url"] is None


def test_proxy_url_rejects_invalid_base_url(monkeypatch):
    monkeypatch.setattr(deployer_main, "redis_client", DummyRedis())
    client = TestClient(deployer_main.app)
    resp = client.post("/services/svc/proxy-url", json={"base_url": "invalid-url"})
    assert resp.status_code == 400


def test_cloudflare_tunnel_start_endpoint(monkeypatch):
    monkeypatch.setattr(deployer_main, "_ensure_cloudflared_tunnel", lambda: "https://demo.trycloudflare.com")
    client = TestClient(deployer_main.app)
    resp = client.post("/cloudflare/tunnel/start")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "running"
    assert body["url"] == "https://demo.trycloudflare.com"


def test_health_endpoint():
    client = TestClient(deployer_main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

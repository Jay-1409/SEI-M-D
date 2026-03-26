from __future__ import annotations

from fastapi.testclient import TestClient

from conftest import load_module


nikto_main = load_module("backend/nikto/main.py", "nikto_main_tests")


def test_generate_api_paths_contains_common_specs():
    paths = nikto_main.generate_api_paths()
    assert "/openapi.json" in paths
    assert "/swagger.json" in paths
    assert len(paths) == len(set(paths))


def test_health_endpoint_reports_status(monkeypatch):
    class DummyRedis:
        def ping(self):
            return True

    monkeypatch.setattr(nikto_main, "redis_client", DummyRedis())
    client = TestClient(nikto_main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_trigger_scan_returns_running_and_persists(monkeypatch):
    saved = {}

    def fake_save(scan_result):
        saved["scan"] = scan_result

    def fake_bg(*args, **kwargs):
        return None

    monkeypatch.setattr(nikto_main, "_save_scan", fake_save)
    monkeypatch.setattr(nikto_main, "run_nikto_scan", fake_bg)

    client = TestClient(nikto_main.app)
    resp = client.post(
        "/scan",
        json={"target_url": "http://service:8080", "service_name": "svc"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["scan_status"] == "running"
    assert body["service_name"] == "svc"
    assert "scan" in saved


def test_get_scan_result_not_found(monkeypatch):
    monkeypatch.setattr(nikto_main, "_get_scan", lambda _sid: None)
    client = TestClient(nikto_main.app)
    resp = client.get("/scan/missing-id")
    assert resp.status_code == 404
    assert "not found" in resp.text.lower()

from __future__ import annotations

from fastapi.testclient import TestClient

from conftest import load_module


trivy_main = load_module("backend/trivy/main.py", "trivy_main_tests")


def test_health_endpoint():
    client = TestClient(trivy_main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_trigger_scan_returns_running(monkeypatch):
    saved = {}

    def fake_save(scan_result):
        saved["scan"] = scan_result

    def fake_runner(*_args, **_kwargs):
        return None

    monkeypatch.setattr(trivy_main, "_save_scan", fake_save)
    monkeypatch.setattr(trivy_main, "run_trivy_scan", fake_runner)

    client = TestClient(trivy_main.app)
    resp = client.post("/scan", json={"image_name": "demo:latest"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["scan_status"] == "running"
    assert body["image_name"] == "demo:latest"
    assert "scan" in saved


def test_get_scan_by_id_not_found(monkeypatch):
    monkeypatch.setattr(trivy_main, "_get_scan", lambda _sid: None)
    client = TestClient(trivy_main.app)
    resp = client.get("/scan/missing")
    assert resp.status_code == 404


def test_get_scan_by_image_not_found(monkeypatch):
    monkeypatch.setattr(trivy_main, "_get_scan_by_image", lambda _name: None)
    client = TestClient(trivy_main.app)
    resp = client.get("/scan/image/demo:latest")
    assert resp.status_code == 404

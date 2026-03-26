from __future__ import annotations

import io

from fastapi.testclient import TestClient

from conftest import load_module


image_main = load_module("backend/image/main.py", "image_main_tests")


def test_health_endpoint():
    client = TestClient(image_main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["service"] == "image-service"


def test_upload_returns_503_when_docker_unavailable(monkeypatch):
    monkeypatch.setattr(image_main, "docker_client", None)
    client = TestClient(image_main.app)

    resp = client.post(
        "/upload",
        files={"file": ("image.tar", b"fake-content", "application/x-tar")},
    )
    assert resp.status_code == 503
    assert "Docker client not available" in resp.text


def test_list_images_success(monkeypatch):
    class DummyImagesApi:
        def list(self):
            img = type("Img", (), {})()
            img.tags = ["demo:latest"]
            img.id = "sha256:1234"
            img.attrs = {"Size": 42}
            return [img]

    dummy_client = type("DummyDocker", (), {"images": DummyImagesApi()})()
    monkeypatch.setattr(image_main, "docker_client", dummy_client)

    client = TestClient(image_main.app)
    resp = client.get("/images")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "demo:latest"
    assert body[0]["size"] == 42


def test_upload_success_extracts_ports(monkeypatch):
    class LoadedImage:
        id = "sha256:abc"
        tags = ["svc:latest"]

    class DummyImagesApi:
        def load(self, _fobj):
            return [LoadedImage()]

        def get(self, _name):
            obj = type("Image", (), {})()
            obj.attrs = {"Config": {"ExposedPorts": {"8080/tcp": {}, "8443/tcp": {}}}, "Size": 100}
            return obj

    dummy_client = type("DummyDocker", (), {"images": DummyImagesApi()})()
    monkeypatch.setattr(image_main, "docker_client", dummy_client)

    client = TestClient(image_main.app)
    resp = client.post(
        "/upload",
        files={"file": ("image.tar", io.BytesIO(b"tar-bytes"), "application/x-tar")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert sorted(body["ports"]) == [8080, 8443]

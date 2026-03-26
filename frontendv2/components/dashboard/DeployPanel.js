"use client";

import { useState } from "react";
import { apiFetch, startTunnelAndCreateProxy } from "../../lib/api";

export default function DeployPanel({ onDeployed }) {
  const [serviceName, setServiceName] = useState("");
  const [containerPort, setContainerPort] = useState("8000");
  const [uploadedImageName, setUploadedImageName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState(null);

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch("/upload-image", {
        method: "POST",
        body: formData,
      });
      setUploadedImageName(result.image_name);
      if (result.suggested_port) {
        setContainerPort(String(result.suggested_port));
      }
      setStatus({ type: "ok", text: `Image loaded: ${result.image_name}` });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!uploadedImageName) {
      setStatus({ type: "error", text: "Upload a Docker image first." });
      return;
    }

    setDeploying(true);
    setStatus(null);
    try {
      const payload = {
        service_name: serviceName.trim(),
        docker_image: uploadedImageName,
        container_port: Number(containerPort),
      };
      const deploy = await apiFetch("/deploy-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let proxyUrl = null;
      try {
        proxyUrl = await startTunnelAndCreateProxy(payload.service_name);
      } catch (_error) {
        proxyUrl = null;
      }

      setStatus({
        type: "ok",
        text: proxyUrl
          ? `Deployed. Public URL: ${proxyUrl}`
          : `Deployed. Internal URL: ${deploy.public_url}`,
      });
      setServiceName("");
      onDeployed?.();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Deploy Service</h2>
      <form className="grid-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Service Name</span>
          <input
            required
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="pay-s"
          />
        </label>

        <label className="field">
          <span>Container Port</span>
          <input
            required
            type="number"
            value={containerPort}
            onChange={(e) => setContainerPort(e.target.value)}
            placeholder="8000"
          />
        </label>

        <label className="field">
          <span>Upload Docker TAR</span>
          <input type="file" accept=".tar" onChange={onFileChange} />
        </label>

        <label className="field">
          <span>Loaded Image</span>
          <input
            value={uploadedImageName}
            readOnly
            placeholder="No image loaded yet"
          />
        </label>

        <button
          className="primary-btn"
          type="submit"
          disabled={deploying || uploading}
        >
          {deploying ? "Deploying..." : "Deploy"}
        </button>
      </form>
      {uploading && <p className="muted">Uploading image...</p>}
      {status && (
        <p className={status.type === "error" ? "status-error" : "status-ok"}>
          {status.text}
        </p>
      )}
    </section>
  );
}

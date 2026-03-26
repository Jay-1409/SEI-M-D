"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DeployCard.module.css";
import type { StatusBoxState, TrivyResult, TrivyState } from "./types";

const API_BASE = "/api";

type DeployCardProps = {
  onDeployed: () => void;
};

async function createServiceProxyUrl(serviceName: string): Promise<string> {
  const tunnelResp = await fetch(`${API_BASE}/cloudflare/tunnel/start`, {
    method: "POST",
  });
  const tunnelData = await tunnelResp.json();
  if (!tunnelResp.ok) {
    throw new Error(tunnelData.detail || "Failed to start Cloudflare tunnel");
  }

  const resp = await fetch(`${API_BASE}/services/${serviceName}/proxy-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_url: tunnelData.url }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.detail || "Failed to save public proxy URL");
  }

  localStorage.setItem("cloudflare_tunnel_base_url", data.base_url);
  return data.proxy_url;
}

function shakeElement(el: HTMLElement | null) {
  if (!el) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 300 },
  );
}

export default function DeployCard({ onDeployed }: DeployCardProps) {
  const [serviceName, setServiceName] = useState("");
  const [containerPort, setContainerPort] = useState("");
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(
    null,
  );
  const [dropHover, setDropHover] = useState(false);
  const [dropHasFile, setDropHasFile] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [statusBox, setStatusBox] = useState<StatusBoxState | null>(null);
  const [portHighlight, setPortHighlight] = useState(false);
  const [trivyState, setTrivyState] = useState<TrivyState>({
    kind: "disabled",
  });
  const [fileMessage, setFileMessage] = useState<{
    kind: "none" | "uploading" | "success" | "error";
    text: string;
  }>({ kind: "none", text: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const statusBoxRef = useRef<HTMLDivElement | null>(null);

  const trivyContainerStyle = useMemo(
    () => ({
      display: "block",
      marginTop: "15px",
      padding: "12px",
      borderRadius: "8px",
      fontSize: "0.9em",
      background: "rgba(0, 0, 0, 0.1)",
    }),
    [],
  );

  const fileNameStyle = useMemo(() => {
    if (fileMessage.kind === "success") return { color: "var(--success)" };
    if (fileMessage.kind === "error") return { color: "var(--error)" };
    return undefined;
  }, [fileMessage.kind]);

  useEffect(() => {
    setTrivyState((prev) => {
      if (!uploadedImageName && prev.kind !== "disabled") {
        return { kind: "disabled" };
      }
      if (uploadedImageName && prev.kind === "disabled") {
        return { kind: "ready" };
      }
      return prev;
    });
  }, [uploadedImageName]);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".tar")) {
      shakeElement(dropZoneRef.current);
      alert("Please use a .tar file");
      return;
    }

    setFileMessage({ kind: "uploading", text: `Uploading ${file.name}...` });
    setDropHasFile(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch(`${API_BASE}/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.detail || "Upload failed");

      setUploadedImageName(data.image_name);
      setFileMessage({ kind: "success", text: `✓ ${data.image_name}` });
      setTrivyState({ kind: "ready" });

      if (data.suggested_port) {
        setContainerPort(String(data.suggested_port));
        setPortHighlight(true);
        setTimeout(() => setPortHighlight(false), 1000);
      }
    } catch (err) {
      setFileMessage({ kind: "error", text: "✗ Upload failed" });
      shakeElement(dropZoneRef.current);
      console.error(err);
      if (!uploadedImageName) setTrivyState({ kind: "disabled" });
    }
  }

  async function runTrivyScan() {
    if (!uploadedImageName) {
      setTrivyState({ kind: "disabled" });
      return;
    }

    setTrivyState({ kind: "scanning" });

    try {
      const triggerResp = await fetch(`${API_BASE}/scan-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_name: uploadedImageName }),
      });

      if (!triggerResp.ok) throw new Error("Failed to start scan");

      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const pollResp = await fetch(
          `${API_BASE}/scan-image/${uploadedImageName}`,
        );
        if (!pollResp.ok) continue;

        const result: TrivyResult = await pollResp.json();
        if (result.scan_status === "completed") {
          setTrivyState({ kind: "result", result });
          return;
        }
        if (result.scan_status === "failed") {
          setTrivyState({
            kind: "error",
            message: `✗ Scan failed: ${result.error || "Unknown error"}`,
          });
          return;
        }
      }

      setTrivyState({ kind: "error", message: "✗ Scan timed out" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setTrivyState({ kind: "error", message: `✗ Error: ${message}` });
    }
  }

  async function onDeploySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!uploadedImageName) {
      shakeElement(dropZoneRef.current);
      return;
    }

    setDeploying(true);
    setStatusBox(null);

    try {
      const resp = await fetch(`${API_BASE}/deploy-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: serviceName.trim(),
          docker_image: uploadedImageName,
          container_port: parseInt(containerPort, 10),
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Deployment failed");

      const deployedServiceName = serviceName.trim();
      let publicProxyUrl: string | null = null;
      try {
        publicProxyUrl = await createServiceProxyUrl(deployedServiceName);
      } catch (proxyErr) {
        console.warn("Proxy URL auto-create failed:", proxyErr);
      }

      setStatusBox({
        kind: "success",
        internalUrl: data.public_url,
        publicUrl: publicProxyUrl,
      });

      setServiceName("");
      setContainerPort("");
      setUploadedImageName(null);
      setFileMessage({ kind: "none", text: "" });
      setDropHasFile(false);
      setTrivyState({ kind: "disabled" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      onDeployed();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deployment failed";
      setStatusBox({ kind: "error", message });
      shakeElement(statusBoxRef.current);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className={styles.componentScope}>
      <div className="card deploy-theme">
        <h2>
          <div className="icon-box">📦</div>
          Deploy New Service
        </h2>
        <form id="deployForm" onSubmit={onDeploySubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="serviceName">Service Name</label>
              <input
                type="text"
                id="serviceName"
                className="form-input"
                placeholder="e.g. payment-service"
                pattern="^[a-z][a-z0-9\-]{1,61}[a-z0-9]$"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Docker Image</label>
              <div
                className={`drop-zone${dropHover ? " hover" : ""}${dropHasFile ? " has-file" : ""}`}
                id="dropZone"
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropHover(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropHover(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropHover(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropHover(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
              >
                <div className="drop-zone-content">
                  <div className="drop-zone-icon">☁️</div>
                  <div className="drop-zone-text">Click or drop .tar file</div>
                  <div
                    className="drop-zone-file-name"
                    id="fileName"
                    style={fileNameStyle}
                  >
                    {fileMessage.kind === "uploading" ? (
                      <>
                        <span
                          className="spinner"
                          style={{
                            borderTopColor: "currentColor",
                            width: "16px",
                            height: "16px",
                            borderWidth: "2px",
                            verticalAlign: "middle",
                            display: "inline-block",
                            marginRight: "8px",
                          }}
                        />
                        {fileMessage.text}
                      </>
                    ) : (
                      fileMessage.text
                    )}
                  </div>
                </div>
              </div>
              <input
                type="file"
                id="imageFile"
                className="file-input-hidden"
                accept=".tar"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <input
                type="hidden"
                id="dockerImage"
                value={uploadedImageName || ""}
                readOnly
                required
              />

              <div id="trivyScanContainer" style={trivyContainerStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    border: uploadedImageName
                      ? "1px solid var(--accent)"
                      : "1px solid rgba(148, 163, 184, 0.45)",
                    background: uploadedImageName
                      ? "transparent"
                      : "rgba(148, 163, 184, 0.08)",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <span>
                    <span
                      className="icon-box"
                      style={{
                        width: "24px",
                        height: "24px",
                        fontSize: "12px",
                        margin: 0,
                      }}
                    >
                      🛡️
                    </span>{" "}
                    <strong>
                      {uploadedImageName
                        ? "Manual scan ready"
                        : "Manual scan only: upload an image to enable Trivy"}
                    </strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={runTrivyScan}
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.85em",
                      opacity:
                        !uploadedImageName || trivyState.kind === "scanning"
                          ? 0.6
                          : 1,
                      cursor:
                        !uploadedImageName || trivyState.kind === "scanning"
                          ? "not-allowed"
                          : "pointer",
                    }}
                    disabled={
                      !uploadedImageName || trivyState.kind === "scanning"
                    }
                  >
                    {trivyState.kind === "scanning"
                      ? "Scanning..."
                      : "Run Trivy Scan"}
                  </button>
                </div>

                {trivyState.kind === "scanning" ? (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      className="spinner"
                      style={{
                        borderTopColor: "currentColor",
                        width: "16px",
                        height: "16px",
                        borderWidth: "2px",
                        marginRight: "8px",
                      }}
                    />
                    <span>
                      Scanning image for vulnerabilities... This may take a
                      minute.
                    </span>
                  </div>
                ) : null}

                {trivyState.kind === "error" ? (
                  <span style={{ color: "var(--error)" }}>
                    {trivyState.message}
                  </span>
                ) : null}

                {trivyState.kind === "result"
                  ? (() => {
                      const result = trivyState.result;

                      let badgeColor = "var(--success)";
                      let title = "Image is Secure";
                      if ((result.critical_findings || 0) > 0) {
                        badgeColor = "var(--error)";
                        title = `${result.critical_findings} Critical Vulnerabilities!`;
                      } else if ((result.high_findings || 0) > 0) {
                        badgeColor = "var(--warning)";
                        title = `${result.high_findings} High Vulnerabilities`;
                      }

                      const bgColor =
                        badgeColor === "var(--error)"
                          ? "rgba(239,68,68,0.1)"
                          : badgeColor === "var(--success)"
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(245,158,11,0.1)";

                      return (
                        <div
                          style={{
                            border: `1px solid ${badgeColor}`,
                            background: bgColor,
                            borderRadius: "8px",
                            padding: "10px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <strong style={{ color: badgeColor }}>
                              🛡️ {title}
                            </strong>
                            <span>
                              Total Findings: {result.total_findings || 0}
                            </span>
                          </div>

                          {result.vulnerabilities?.length ? (
                            <div
                              style={{
                                maxHeight: "150px",
                                overflowY: "auto",
                                background: "rgba(0,0,0,0.2)",
                                borderRadius: "4px",
                                padding: "6px",
                              }}
                            >
                              {result.vulnerabilities.slice(0, 10).map((v) => {
                                const color =
                                  v.severity === "CRITICAL"
                                    ? "var(--error)"
                                    : v.severity === "HIGH"
                                      ? "var(--warning)"
                                      : "inherit";
                                return (
                                  <div
                                    key={`${v.id}-${v.pkg_name}`}
                                    style={{
                                      padding: "4px",
                                      borderBottom:
                                        "1px solid rgba(255,255,255,0.1)",
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <span>
                                      <strong style={{ color }}>
                                        {v.severity}
                                      </strong>
                                      : {v.pkg_name}
                                    </span>
                                    <span style={{ opacity: 0.7 }}>{v.id}</span>
                                  </div>
                                );
                              })}
                              {result.vulnerabilities.length > 10 ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "4px",
                                    fontStyle: "italic",
                                    opacity: 0.7,
                                  }}
                                >
                                  + {result.vulnerabilities.length - 10} more...
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()
                  : null}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="containerPort">Port</label>
              <input
                type="number"
                id="containerPort"
                className="form-input"
                placeholder="8080"
                min="1"
                max="65535"
                required
                value={containerPort}
                onChange={(e) => setContainerPort(e.target.value)}
                style={
                  portHighlight ? { borderColor: "var(--success)" } : undefined
                }
              />
            </div>
          </div>

          <div
            id="statusBox"
            ref={statusBoxRef}
            className={`status-box${statusBox?.kind === "success" ? " success" : ""}${statusBox?.kind === "error" ? " error" : ""}`}
            style={{ display: statusBox ? "block" : "none" }}
          >
            {statusBox?.kind === "success" ? (
              <>
                <strong>Success!</strong> Service is live.
                <br />
                <Link
                  href={statusBox.internalUrl}
                  target="_blank"
                  style={{
                    color: "inherit",
                    textDecoration: "underline",
                    fontWeight: 700,
                    marginTop: "8px",
                    display: "inline-block",
                  }}
                >
                  Internal: {statusBox.internalUrl} ↗
                </Link>
                {statusBox.publicUrl ? (
                  <>
                    <br />
                    <Link
                      href={statusBox.publicUrl}
                      target="_blank"
                      style={{
                        color: "inherit",
                        textDecoration: "underline",
                        fontWeight: 700,
                        marginTop: "8px",
                        display: "inline-block",
                      }}
                    >
                      Public: {statusBox.publicUrl} ↗
                    </Link>
                  </>
                ) : (
                  <>
                    <br />
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        opacity: 0.75,
                      }}
                    >
                      Public proxy URL could not be created automatically.
                    </span>
                  </>
                )}
              </>
            ) : null}

            {statusBox?.kind === "error" ? (
              <>
                <strong>Deployment Failed</strong>
                <br />
                {statusBox.message}
              </>
            ) : null}
          </div>

          <div style={{ textAlign: "right" }}>
            <button
              type="submit"
              className="btn btn-primary"
              id="deployBtn"
              disabled={deploying}
            >
              {deploying ? (
                <>
                  <div className="spinner" /> Deploying...
                </>
              ) : (
                <>
                  <span className="btn-text">Data Center Deploy</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

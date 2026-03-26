"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function TrivyPanel({ services = [] }) {
  const serviceOptions = useMemo(
    () =>
      services
        .map((s) => ({ name: s.service_name, image: s.docker_image }))
        .filter((s) => s.name),
    [services],
  );
  const [serviceName, setServiceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const selectedImage = useMemo(
    () => serviceOptions.find((s) => s.name === serviceName)?.image || "",
    [serviceName, serviceOptions],
  );

  async function runScan() {
    if (!serviceName) {
      setError("Select a service first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const encoded = encodeURIComponent(serviceName);
      await apiFetch(`/services/${encoded}/trivy-scan`, { method: "POST" });

      let attempts = 0;
      const maxAttempts = 45;
      while (attempts < maxAttempts) {
        attempts += 1;
        const scan = await apiFetch(`/services/${encoded}/trivy-scan`);
        if (scan.scan_status === "completed") {
          setResult(scan);
          setLoading(false);
          return;
        }
        if (scan.scan_status === "failed") {
          throw new Error(scan.error || "Trivy scan failed");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw new Error("Trivy scan timed out");
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Trivy Image Scan</h2>
      <p className="muted">Select a deployed service and run Trivy manually.</p>

      <div className="inline-form">
        <select
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        >
          <option value="">Select service</option>
          {serviceOptions.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className="primary-btn"
          onClick={runScan}
          disabled={loading || !serviceName}
        >
          {loading ? "Scanning..." : "Run Trivy"}
        </button>
      </div>
      {selectedImage ? <p className="muted">Image: {selectedImage}</p> : null}

      {error ? <p className="status-error">{error}</p> : null}
      {loading ? <p className="muted">Running Trivy scan...</p> : null}

      {result ? (
        <div className="scan-box">
          <div className="scan-head">
            <strong>Total Findings: {result.total_findings || 0}</strong>
            <span>
              Critical: {result.critical_findings || 0} | High:{" "}
              {result.high_findings || 0}
            </span>
          </div>
          <div className="event-list">
            {(result.vulnerabilities || []).slice(0, 12).map((v) => (
              <div className="event-item" key={`${v.id}-${v.pkg_name}`}>
                <span>{v.severity}</span>
                <code>
                  {v.pkg_name} ({v.id})
                </code>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

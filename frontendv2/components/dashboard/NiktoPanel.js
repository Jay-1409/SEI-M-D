"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function NiktoPanel({ services = [] }) {
  const serviceOptions = useMemo(
    () => services.map((s) => s.service_name).filter(Boolean),
    [services],
  );
  const [serviceName, setServiceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function runScan() {
    if (!serviceName) {
      setError("Select a service first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      await apiFetch(`/services/${serviceName}/scan`, { method: "POST" });

      let attempts = 0;
      const maxAttempts = 45;
      while (attempts < maxAttempts) {
        attempts += 1;
        const scan = await apiFetch(`/services/${serviceName}/scan`);
        if (scan.scan_status === "completed") {
          setResult(scan);
          setLoading(false);
          return;
        }
        if (scan.scan_status === "failed") {
          throw new Error(scan.error || "Nikto scan failed");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw new Error("Nikto scan timed out");
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Nikto Service Scan</h2>
      <p className="muted">Scan deployed service endpoints for web vulnerabilities.</p>

      <div className="inline-form">
        <select value={serviceName} onChange={(e) => setServiceName(e.target.value)}>
          <option value="">Select service</option>
          {serviceOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button className="primary-btn" onClick={runScan} disabled={loading || !serviceName}>
          {loading ? "Scanning..." : "Run Nikto"}
        </button>
      </div>

      {error ? <p className="status-error">{error}</p> : null}
      {loading ? <p className="muted">Running Nikto scan...</p> : null}

      {result ? (
        <div className="scan-box">
          <div className="scan-head">
            <strong>Total Findings: {result.total_findings || 0}</strong>
            <span>Status: {result.scan_status}</span>
          </div>
          <div className="event-list">
            {(result.vulnerabilities || []).slice(0, 12).map((v) => (
              <div className="event-item" key={v.id}>
                <span>{v.severity}</span>
                <code>{v.id}</code>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

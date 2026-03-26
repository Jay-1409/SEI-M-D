"use client";

import Link from "next/link";
import styles from "./ServicesCard.module.css";
import type { ServiceInfo } from "./types";

type ServicesCardProps = {
  services: ServiceInfo[] | null;
};

const API_BASE = "/api";

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

export default function ServicesCard({ services }: ServicesCardProps) {
  async function openServiceProxyUrl(serviceName: string) {
    try {
      const getResp = await fetch(
        `${API_BASE}/services/${serviceName}/proxy-url`,
      );
      const current = await getResp.json();

      let proxyUrl: string | null = current.proxy_url || null;

      if (!proxyUrl) {
        proxyUrl = await createServiceProxyUrl(serviceName);
      }

      if (!proxyUrl) return;

      window.open(proxyUrl, "_blank");

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(proxyUrl);
          alert(`Public URL opened and copied:\n${proxyUrl}`);
          return;
        } catch {
          // ignore clipboard error and fallback to regular alert
        }
      }

      alert(`Public URL opened:\n${proxyUrl}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      alert(`Failed to create/open public URL: ${message}`);
    }
  }

  return (
    <div className={styles.componentScope}>
      <div className="card list-theme">
        <h2>
          <div className="icon-box">📡</div>
          Active Deployments
        </h2>
        <div id="servicesContainer">
          {services === null ? (
            <div style={{ padding: "24px", opacity: 0.5 }}>
              <div
                style={{
                  height: "60px",
                  background: "rgba(255, 255, 255, 0.2)",
                  marginBottom: "12px",
                  borderRadius: "12px",
                }}
              />
              <div
                style={{
                  height: "60px",
                  background: "rgba(255, 255, 255, 0.2)",
                  marginBottom: "12px",
                  borderRadius: "12px",
                }}
              />
            </div>
          ) : services.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}
              >
                📭
              </div>
              <p>No services active. Deploy one above!</p>
            </div>
          ) : (
            <table className="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Image</th>
                  <th>Port</th>
                  <th>Status</th>
                  <th>Access</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
                  let statusBadge = (
                    <span
                      className="badge"
                      style={{ background: "#EDF2F7", color: "#4A5568" }}
                    >
                      {s.status}
                    </span>
                  );

                  if (s.status === "deployed") {
                    statusBadge = (
                      <span className="badge deployed">Running</span>
                    );
                  } else if (s.status === "stopped") {
                    statusBadge = (
                      <span
                        className="badge"
                        style={{ background: "#FED7D7", color: "#C53030" }}
                      >
                        Stopped
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={s.service_name}
                      className="service-row"
                      onClick={() => {
                        window.location.href = `/service-details?name=${encodeURIComponent(s.service_name)}`;
                      }}
                    >
                      <td>
                        <div className="service-name">{s.service_name}</div>
                      </td>
                      <td>
                        <span className="service-meta">{s.docker_image}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-muted)",
                          }}
                        >
                          :{s.container_port}
                        </span>
                      </td>
                      <td>{statusBadge}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            alignItems: "flex-start",
                          }}
                        >
                          <Link
                            href={s.public_url}
                            target="_blank"
                            className="external-link"
                            onClick={(event) => event.stopPropagation()}
                          >
                            Internal ↗
                          </Link>
                          <Link
                            href="#"
                            className="external-link"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openServiceProxyUrl(s.service_name);
                            }}
                          >
                            Public URL ↗
                          </Link>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          href={`/service-details?name=${encodeURIComponent(s.service_name)}`}
                          className="action-btn"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { apiFetch, startTunnelAndCreateProxy } from "../../lib/api";

export default function ServicesTable({ services, loading, onRefresh }) {
  async function openPublic(serviceName) {
    try {
      const existing = await apiFetch(`/services/${serviceName}/proxy-url`);
      const url = existing.proxy_url || (await startTunnelAndCreateProxy(serviceName));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(`Public URL failed: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panel-title">Services</h2>
        <p className="muted">Loading services...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Services</h2>
        <button className="ghost-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {!services.length ? (
        <p className="muted">No services deployed.</p>
      ) : (
        <div className="table-wrap">
          <table className="services-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Image</th>
                <th>Port</th>
                <th>Status</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.service_name}>
                  <td>
                    <Link href={`/service-details?name=${encodeURIComponent(service.service_name)}`}>
                      {service.service_name}
                    </Link>
                  </td>
                  <td>{service.docker_image}</td>
                  <td>{service.container_port}</td>
                  <td>{service.status}</td>
                  <td>
                    <div className="actions-inline">
                      <a href={service.public_url} target="_blank" rel="noreferrer">
                        Internal
                      </a>
                      <button className="link-btn" onClick={() => openPublic(service.service_name)}>
                        Public
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

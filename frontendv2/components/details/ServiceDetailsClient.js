"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, startTunnelAndCreateProxy } from "../../lib/api";

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ServiceDetailsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const serviceName = params.get("name") || "";

  const [service, setService] = useState(null);
  const [proxy, setProxy] = useState(null);
  const [scan, setScan] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [rateLimit, setRateLimit] = useState({ enabled: true, limit: 100, window: 60, routes: [] });
  const [wafConfig, setWafConfig] = useState({ enabled: false, sqli: false, xss: false, headers: false });
  const [wafStats, setWafStats] = useState(null);
  const [wafEvents, setWafEvents] = useState([]);
  const [apiKeyConfig, setApiKeyConfig] = useState({ enabled: false, keys: [], routes: [] });
  const [newProxyBase, setNewProxyBase] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const ready = useMemo(() => Boolean(serviceName && service), [serviceName, service]);

  async function loadCore() {
    const list = await apiFetch("/services");
    const found = list.find((s) => s.service_name === serviceName);
    if (!found) {
      setService(null);
      throw new Error(`Service '${serviceName}' not found`);
    }
    setService(found);
    setRenameTo(found.service_name);
  }

  async function loadAll() {
    if (!serviceName) return;
    setStatus("");
    try {
      await loadCore();
      const [proxyData, scanData, apiData, rl, waf, ws, we, ak] = await Promise.allSettled([
        apiFetch(`/services/${serviceName}/proxy-url`),
        apiFetch(`/services/${serviceName}/scan`),
        apiFetch(`/services/${serviceName}/apis`),
        apiFetch(`/services/${serviceName}/ratelimit`),
        apiFetch(`/services/${serviceName}/waf/config`),
        apiFetch(`/services/${serviceName}/waf/stats`),
        apiFetch(`/services/${serviceName}/waf/events?limit=20`),
        apiFetch(`/services/${serviceName}/apikey`),
      ]);

      setProxy(proxyData.status === "fulfilled" ? proxyData.value : null);
      setNewProxyBase(proxyData.status === "fulfilled" ? proxyData.value.base_url || "" : "");
      setScan(scanData.status === "fulfilled" ? scanData.value : null);
      setApiInfo(apiData.status === "fulfilled" ? apiData.value : null);
      setRateLimit(rl.status === "fulfilled" ? rl.value : { enabled: true, limit: 100, window: 60, routes: [] });
      setWafConfig(
        waf.status === "fulfilled"
          ? waf.value
          : { enabled: false, sqli: false, xss: false, headers: false }
      );
      setWafStats(ws.status === "fulfilled" ? ws.value : null);
      setWafEvents(we.status === "fulfilled" ? we.value.events || [] : []);
      setApiKeyConfig(ak.status === "fulfilled" ? ak.value : { enabled: false, keys: [], routes: [] });
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, [serviceName]);

  async function runAction(action) {
    if (!serviceName) return;
    setBusy(true);
    setStatus("");
    try {
      if (action === "delete") {
        await apiFetch(`/services/${serviceName}`, { method: "DELETE" });
        router.push("/");
        return;
      }
      if (action === "scan") await apiFetch(`/services/${serviceName}/scan`, { method: "POST" });
      if (action === "start") await apiFetch(`/services/${serviceName}/start`, { method: "POST" });
      if (action === "stop") await apiFetch(`/services/${serviceName}/stop`, { method: "POST" });
      if (action === "public") {
        const url = await startTunnelAndCreateProxy(serviceName);
        window.open(url, "_blank", "noopener,noreferrer");
      }
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRename() {
    if (!renameTo.trim() || renameTo.trim() === serviceName) return;
    setBusy(true);
    setStatus("");
    try {
      const out = await apiFetch(`/services/${serviceName}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_name: renameTo.trim() }),
      });
      router.push(`/service-details?name=${encodeURIComponent(out.new_name)}`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProxyBase() {
    if (!newProxyBase.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/services/${serviceName}/proxy-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_url: newProxyBase.trim() }),
      });
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetProxyBase() {
    setBusy(true);
    try {
      await apiFetch(`/services/${serviceName}/proxy-url`, { method: "DELETE" });
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRateLimit() {
    setBusy(true);
    try {
      await apiFetch(`/services/${serviceName}/ratelimit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rateLimit),
      });
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveWafConfig() {
    setBusy(true);
    try {
      await apiFetch(`/services/${serviceName}/waf/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wafConfig),
      });
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearWafEvents() {
    setBusy(true);
    try {
      await apiFetch(`/services/${serviceName}/waf/events`, { method: "DELETE" });
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveApiKeys() {
    setBusy(true);
    try {
      await apiFetch(`/services/${serviceName}/apikey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKeyConfig),
      });
      await loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="details-wrap">
      <div className="panel-head">
        <h1 className="page-title">Service Details</h1>
        <Link href="/" className="ghost-btn as-link">
          Back
        </Link>
      </div>

      {!serviceName ? <p className="status-error">Missing ?name query param.</p> : null}
      {status ? <p className="status-error">{status}</p> : null}

      {service ? (
        <>
          <section className="panel">
            <h2 className="panel-title">{service.service_name}</h2>
            <InfoRow label="Image" value={service.docker_image} />
            <InfoRow label="Port" value={String(service.container_port)} />
            <InfoRow label="Status" value={service.status} />
            <InfoRow label="Internal URL" value={service.public_url} />
            <InfoRow label="Public URL" value={proxy?.proxy_url || "Not configured"} />
          </section>

          <section className="panel">
            <h2 className="panel-title">Actions</h2>
            <div className="button-row">
              <button className="primary-btn" disabled={!ready || busy} onClick={() => runAction("public")}>
                Create Public URL
              </button>
              <button className="ghost-btn" disabled={!ready || busy} onClick={() => runAction("scan")}>
                Run Scan
              </button>
              <button className="ghost-btn" disabled={!ready || busy} onClick={() => runAction("start")}>
                Start
              </button>
              <button className="ghost-btn" disabled={!ready || busy} onClick={() => runAction("stop")}>
                Stop
              </button>
              <button className="danger-btn" disabled={!ready || busy} onClick={() => runAction("delete")}>
                Delete
              </button>
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">Proxy Config</h2>
            <div className="inline-form">
              <input
                value={newProxyBase}
                placeholder="https://abc.trycloudflare.com"
                onChange={(e) => setNewProxyBase(e.target.value)}
              />
              <button className="primary-btn" disabled={busy} onClick={saveProxyBase}>
                Save
              </button>
              <button className="ghost-btn" disabled={busy} onClick={resetProxyBase}>
                Reset
              </button>
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">Rename</h2>
            <div className="inline-form">
              <input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} />
              <button className="primary-btn" disabled={busy} onClick={saveRename}>
                Rename
              </button>
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">API Discovery</h2>
            {!apiInfo ? (
              <p className="muted">No API discovery data.</p>
            ) : (
              <>
                <InfoRow label="Status" value={apiInfo.status || "unknown"} />
                <InfoRow label="Spec Path" value={apiInfo.spec_path || "-"} />
                <InfoRow label="Version" value={apiInfo.version || "-"} />
              </>
            )}
          </section>

          <section className="panel">
            <h2 className="panel-title">Rate Limit</h2>
            <div className="grid-form">
              <label className="field">
                <span>Enabled</span>
                <select
                  value={rateLimit.enabled ? "true" : "false"}
                  onChange={(e) => setRateLimit({ ...rateLimit, enabled: e.target.value === "true" })}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label className="field">
                <span>Limit</span>
                <input
                  type="number"
                  value={rateLimit.limit}
                  onChange={(e) => setRateLimit({ ...rateLimit, limit: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                <span>Window (sec)</span>
                <input
                  type="number"
                  value={rateLimit.window}
                  onChange={(e) => setRateLimit({ ...rateLimit, window: Number(e.target.value) })}
                />
              </label>
            </div>
            <button className="primary-btn" disabled={busy} onClick={saveRateLimit}>
              Save Rate Limit
            </button>
          </section>

          <section className="panel">
            <h2 className="panel-title">API Key Config</h2>
            <div className="grid-form">
              <label className="field">
                <span>Enabled</span>
                <select
                  value={apiKeyConfig.enabled ? "true" : "false"}
                  onChange={(e) => setApiKeyConfig({ ...apiKeyConfig, enabled: e.target.value === "true" })}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label className="field">
                <span>Comma-separated keys</span>
                <input
                  value={(apiKeyConfig.keys || [])
                    .map((k) => (typeof k === "string" ? k : k.key))
                    .filter(Boolean)
                    .join(",")}
                  onChange={(e) =>
                    setApiKeyConfig({
                      ...apiKeyConfig,
                      keys: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .map((key, i) => ({ id: `k-${i}`, name: `Key ${i + 1}`, key })),
                    })
                  }
                />
              </label>
            </div>
            <button className="primary-btn" disabled={busy} onClick={saveApiKeys}>
              Save API Keys
            </button>
          </section>

          <section className="panel">
            <h2 className="panel-title">WAF</h2>
            <div className="button-row">
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(wafConfig.sqli)}
                  onChange={(e) => setWafConfig({ ...wafConfig, sqli: e.target.checked })}
                />
                SQLi
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(wafConfig.xss)}
                  onChange={(e) => setWafConfig({ ...wafConfig, xss: e.target.checked })}
                />
                XSS
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(wafConfig.headers)}
                  onChange={(e) => setWafConfig({ ...wafConfig, headers: e.target.checked })}
                />
                Header sanitize
              </label>
            </div>
            <div className="button-row">
              <button className="primary-btn" disabled={busy} onClick={saveWafConfig}>
                Save WAF
              </button>
              <button className="ghost-btn" disabled={busy} onClick={clearWafEvents}>
                Clear Events
              </button>
            </div>
            <div className="event-list">
              <InfoRow label="Total Blocked" value={String(wafStats?.total_blocks || 0)} />
              {wafEvents.slice(0, 10).map((event, idx) => (
                <div className="event-item" key={`${event.timestamp}-${idx}`}>
                  <span>{event.attack_type?.toUpperCase() || "WAF"}</span>
                  <code>
                    {event.method} {event.path}
                  </code>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">Latest Scan</h2>
            {!scan ? (
              <p className="muted">No scan data yet.</p>
            ) : (
              <>
                <InfoRow label="Status" value={scan.scan_status} />
                <InfoRow label="Total Findings" value={String(scan.total_findings || 0)} />
                <div className="event-list">
                  {(scan.vulnerabilities || []).slice(0, 10).map((vuln) => (
                    <div className="event-item" key={vuln.id}>
                      <span>{vuln.severity}</span>
                      <code>{vuln.id}</code>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

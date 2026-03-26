"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function WafOverview() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);

  async function load() {
    try {
      const [s, e] = await Promise.all([
        apiFetch("/waf/stats"),
        apiFetch("/waf/events?limit=10"),
      ]);
      setStats(s);
      setEvents(e.events || []);
    } catch (_error) {
      setStats(null);
      setEvents([]);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">WAF Overview</h2>
        <button className="ghost-btn" onClick={load}>
          Refresh
        </button>
      </div>
      {!stats ? (
        <p className="muted">No WAF data available.</p>
      ) : (
        <div className="waf-grid">
          <div className="metric">
            <span>Total</span>
            <strong>{stats.total_blocks || 0}</strong>
          </div>
          <div className="metric">
            <span>SQLi</span>
            <strong>{stats.by_type?.sqli || 0}</strong>
          </div>
          <div className="metric">
            <span>XSS</span>
            <strong>{stats.by_type?.xss || 0}</strong>
          </div>
        </div>
      )}

      <div className="event-list">
        {events.length === 0 ? (
          <p className="muted">No recent blocked events.</p>
        ) : (
          events.map((event) => (
            <div key={event.id || `${event.timestamp}-${event.path}`} className="event-item">
              <span>{event.attack_type?.toUpperCase() || "WAF"}</span>
              <code>
                {event.method} {event.path}
              </code>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import DeployPanel from "./DeployPanel";
import ServicesTable from "./ServicesTable";
import WafOverview from "./WafOverview";
import TrivyPanel from "./TrivyPanel";
import NiktoPanel from "./NiktoPanel";

export default function DashboardClient() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadServices() {
    try {
      setError("");
      const list = await apiFetch("/services");
      setServices(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
    const id = setInterval(loadServices, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dashboard-grid">
      <DeployPanel onDeployed={loadServices} />
      {error ? <p className="status-error">{error}</p> : null}
      <ServicesTable
        services={services}
        loading={loading}
        onRefresh={loadServices}
      />
      <TrivyPanel services={services} />
      <NiktoPanel services={services} />
      <WafOverview />
    </div>
  );
}

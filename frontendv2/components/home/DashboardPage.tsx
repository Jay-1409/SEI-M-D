"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DeployCard from "./DeployCard";
import FooterSection from "./FooterSection";
import HeaderSection from "./HeaderSection";
import styles from "./DashboardRoot.module.css";
import ServicesCard from "./ServicesCard";
import ShutdownModal from "./ShutdownModal";
import ShutdownScreen from "./ShutdownScreen";
import TopControls from "./TopControls";
import type { ServiceInfo } from "./types";

const API_BASE = "/api";

export default function DashboardPage() {
  const [themeIcon, setThemeIcon] = useState("☀️");
  const [services, setServices] = useState<ServiceInfo[] | null>(null);

  const [shutdownOverlayOpen, setShutdownOverlayOpen] = useState(false);
  const [shutdownSubmitting, setShutdownSubmitting] = useState(false);
  const [shutdownScreenActive, setShutdownScreenActive] = useState(false);
  const [shutdownCompleted, setShutdownCompleted] = useState(false);

  const themeButtonRef = useRef<HTMLButtonElement | null>(null);

  const loadServices = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/services`, { cache: "no-store" });
      const list = await resp.json();
      if (resp.ok && Array.isArray(list)) {
        setServices(list);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      root.setAttribute("data-theme", "dark");
      setThemeIcon("🌙");
    } else {
      root.setAttribute("data-theme", "light");
      setThemeIcon("☀️");
    }
  }, []);

  useEffect(() => {
    loadServices();
    const intervalId = setInterval(loadServices, 10000);
    return () => clearInterval(intervalId);
  }, [loadServices]);

  function onToggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setThemeIcon(newTheme === "dark" ? "🌙" : "☀️");

    themeButtonRef.current?.animate(
      [
        { transform: "rotate(0deg) scale(1)" },
        { transform: "rotate(360deg) scale(1.2)" },
        { transform: "rotate(0deg) scale(1)" },
      ],
      { duration: 500 },
    );
  }

  async function onConfirmShutdown() {
    setShutdownSubmitting(true);

    try {
      const resp = await fetch(`${API_BASE}/gracefull-stop`, {
        method: "POST",
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || "Shutdown failed");
      }

      setShutdownOverlayOpen(false);
      setShutdownScreenActive(true);
      setShutdownCompleted(false);

      setTimeout(() => {
        setShutdownCompleted(true);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setShutdownSubmitting(false);
      alert(`Shutdown failed: ${message}`);
      return;
    }

    setShutdownSubmitting(false);
  }

  return (
    <div className={styles.componentScope}>
      <div className="container">
        <TopControls
          themeIcon={themeIcon}
          onToggleTheme={onToggleTheme}
          onPowerOff={() => setShutdownOverlayOpen(true)}
          themeButtonRef={themeButtonRef}
        />

        <ShutdownModal
          open={shutdownOverlayOpen}
          submitting={shutdownSubmitting}
          onCancel={() => setShutdownOverlayOpen(false)}
          onConfirm={onConfirmShutdown}
        />

        <ShutdownScreen active={shutdownScreenActive} completed={shutdownCompleted} />

        <HeaderSection />

        <div className="dashboard-grid">
          <DeployCard onDeployed={loadServices} />
          <ServicesCard services={services} />
        </div>

        <FooterSection />
      </div>
    </div>
  );
}

"use client";

import type { RefObject } from "react";
import styles from "./TopControls.module.css";

type TopControlsProps = {
  themeIcon: string;
  onToggleTheme: () => void;
  onPowerOff: () => void;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
};

export default function TopControls({
  themeIcon,
  onToggleTheme,
  onPowerOff,
  themeButtonRef,
}: TopControlsProps) {
  return (
    <div className={styles.componentScope}>
      <div className="top-controls">
        <button
          ref={themeButtonRef}
          className="theme-toggle"
          id="themeToggle"
          aria-label="Toggle Dark Mode"
          title="Toggle Dark Mode"
          onClick={onToggleTheme}
          type="button"
        >
          {themeIcon}
        </button>
        <button
          className="power-off-btn"
          id="powerOffBtn"
          aria-label="Shutdown All Services"
          title="Shutdown All Services"
          onClick={onPowerOff}
          type="button"
        >
          ⏻
        </button>
      </div>
    </div>
  );
}

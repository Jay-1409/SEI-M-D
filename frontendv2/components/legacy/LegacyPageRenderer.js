"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function cloneScript(script) {
  const s = document.createElement("script");
  for (const attr of script.attributes) {
    s.setAttribute(attr.name, attr.value);
  }
  s.text = script.text || "";
  return s;
}

export default function LegacyPageRenderer({ templatePath }) {
  const containerRef = useRef(null);
  const [html, setHtml] = useState("");
  const headKey = useMemo(
    () => `legacy-head-${templatePath.replace(/[^a-z0-9]/gi, "_")}`,
    [templatePath],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const resp = await fetch(templatePath, { cache: "no-store" });
      const raw = await resp.text();
      if (cancelled) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");

      const headHost = document.getElementById(headKey) || document.createElement("div");
      headHost.id = headKey;
      headHost.innerHTML = "";

      [...doc.head.querySelectorAll("style,link,meta,title")].forEach((node) => {
        headHost.appendChild(node.cloneNode(true));
      });

      if (!document.getElementById(headKey)) {
        document.head.appendChild(headHost);
      }

      setHtml(doc.body.innerHTML);

      requestAnimationFrame(() => {
        if (cancelled || !containerRef.current) return;
        const scripts = doc.body.querySelectorAll("script");
        scripts.forEach((script) => {
          containerRef.current.appendChild(cloneScript(script));
        });
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [templatePath, headKey]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    cache: "no-store",
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && (body.detail || body.message)) ||
      (typeof body === "string" && body) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

export async function startTunnelAndCreateProxy(serviceName) {
  const tunnel = await apiFetch("/cloudflare/tunnel/start", { method: "POST" });
  const proxy = await apiFetch(`/services/${serviceName}/proxy-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_url: tunnel.url }),
  });
  return proxy.proxy_url;
}

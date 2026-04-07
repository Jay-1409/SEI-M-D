(function (globalScope) {
  const STORAGE_KEY = "simulation.globalEnv.v1";
  const DEFAULT_CONFIG = {
    serviceName: "expo-unified-target",
  };

  function normalizeServiceName(value) {
    if (typeof value !== "string") {
      return DEFAULT_CONFIG.serviceName;
    }

    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized || DEFAULT_CONFIG.serviceName;
  }

  function normalizeRoutePath(value) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) {
      return "/";
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  function normalizeBaseUrl(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value.trim().replace(/\/+$/, "");
  }

  function readStoredConfig() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function getConfig() {
    const stored = readStoredConfig();
    return {
      serviceName: normalizeServiceName(stored.serviceName || DEFAULT_CONFIG.serviceName),
    };
  }

  function setConfig(partialConfig) {
    const current = getConfig();
    const next = {
      ...current,
      ...(partialConfig || {}),
    };
    next.serviceName = normalizeServiceName(next.serviceName);

    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      // Ignore localStorage failures and still return normalized value.
    }

    return next;
  }

  function resetConfig() {
    try {
      globalScope.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore localStorage failures.
    }
    return getConfig();
  }

  function buildServiceRoute(serviceName, routePath) {
    const normalizedService = normalizeServiceName(serviceName || getConfig().serviceName);
    const normalizedRoute = normalizeRoutePath(routePath);
    if (normalizedRoute === "/") {
      return `/${normalizedService}`;
    }
    return `/${normalizedService}${normalizedRoute}`;
  }

  function buildGatewayUrl(gatewayBaseUrl, serviceName, routePath) {
    const base = normalizeBaseUrl(gatewayBaseUrl);
    const route = buildServiceRoute(serviceName, routePath);
    return base ? `${base}${route}` : route;
  }

  globalScope.SimulationGlobalEnv = Object.freeze({
    defaultConfig: { ...DEFAULT_CONFIG },
    getConfig,
    setConfig,
    resetConfig,
    normalizeServiceName,
    buildServiceRoute,
    buildGatewayUrl,
  });
})(window);

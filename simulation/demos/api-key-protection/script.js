const DEMO_KEYS = {
  valid: "STAFF-ACCESS-DEMO-2026",
  wrong: "STAFF-KEY-DEMO-WRONG",
};

const LIVE_DEFAULTS = {
  gatewayBaseUrl: "http://localhost:30080",
  publicRoute: "/expo-api-demo/public/help-hours",
  protectedRoute: "/expo-api-demo/staff/open-maintenance-panel",
};

const ROUTES = {
  "public-help-hours": {
    label: "GET /public/help-hours",
    type: "Public",
    badgeClass: "public",
    story: "This route is like a lobby notice board. Visitors can read it without a staff key.",
    keyHint: "This route is open to everyone. No access key is needed.",
    liveField: "publicRoute",
    method: "GET",
  },
  "protected-maintenance-panel": {
    label: "POST /staff/open-maintenance-panel",
    type: "Protected",
    badgeClass: "protected",
    story: "This route is a staff-only action. The system checks for a valid digital access card before it can run.",
    keyHint: "This route needs a valid staff access key before the staff-only action can happen.",
    liveField: "protectedRoute",
    method: "POST",
  },
};

const state = {
  selectedRoute: "public-help-hours",
  apiKey: "",
  allowedCount: 0,
  deniedCount: 0,
  eventLog: [],
  connectionMode: "local",
  liveConfig: { ...LIVE_DEFAULTS },
  connectionStatus: {
    tone: "info",
    message: "Local simulation is ready. Switch to live mode after a real service is deployed behind the gateway.",
  },
  lastHttpStatus: null,
  lastResult: null,
  requestInFlight: false,
};

const elements = {
  connectionModeSelect: document.querySelector("#connectionModeSelect"),
  connectionModeBadge: document.querySelector("#connectionModeBadge"),
  liveConfigFields: document.querySelector("#liveConfigFields"),
  gatewayBaseUrlInput: document.querySelector("#gatewayBaseUrlInput"),
  publicRouteInput: document.querySelector("#publicRouteInput"),
  protectedRouteInput: document.querySelector("#protectedRouteInput"),
  liveDefaultsButton: document.querySelector("#liveDefaultsButton"),
  connectionStatusCard: document.querySelector("#connectionStatusCard"),
  routeSelect: document.querySelector("#routeSelect"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  noKeyButton: document.querySelector("#noKeyButton"),
  validKeyButton: document.querySelector("#validKeyButton"),
  wrongKeyButton: document.querySelector("#wrongKeyButton"),
  sendRequestButton: document.querySelector("#sendRequestButton"),
  resetButton: document.querySelector("#resetButton"),
  routeTypeBadge: document.querySelector("#routeTypeBadge"),
  keyHint: document.querySelector("#keyHint"),
  selectedRouteCard: document.querySelector("#selectedRouteCard"),
  routeStory: document.querySelector("#routeStory"),
  keyCheckCard: document.querySelector("#keyCheckCard"),
  keyCheckCopy: document.querySelector("#keyCheckCopy"),
  decisionCard: document.querySelector("#decisionCard"),
  decisionCopy: document.querySelector("#decisionCopy"),
  outcomeBadge: document.querySelector("#outcomeBadge"),
  outcomeSummary: document.querySelector("#outcomeSummary"),
  proofMode: document.querySelector("#proofMode"),
  currentOutcome: document.querySelector("#currentOutcome"),
  proofRouteType: document.querySelector("#proofRouteType"),
  proofKeyStatus: document.querySelector("#proofKeyStatus"),
  actionResult: document.querySelector("#actionResult"),
  httpStatus: document.querySelector("#httpStatus"),
  securityAction: document.querySelector("#securityAction"),
  securityReason: document.querySelector("#securityReason"),
  securityRoute: document.querySelector("#securityRoute"),
  resultCard: document.querySelector("#resultCard"),
  resultContent: document.querySelector("#resultContent"),
  allowedCount: document.querySelector("#allowedCount"),
  deniedCount: document.querySelector("#deniedCount"),
  eventLog: document.querySelector("#eventLog"),
  demoKeyReference: document.querySelector("#demoKeyReference"),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function normalizeRoutePath(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function formatHttpStatus(status) {
  return status == null ? "Not sent" : String(status);
}

function addLogEntry({ title, message, statusClass }) {
  state.eventLog.unshift({
    timestamp: createTimestamp(),
    title,
    message,
    statusClass,
  });
  state.eventLog = state.eventLog.slice(0, 8);
}

function renderEventLog() {
  if (state.eventLog.length === 0) {
    elements.eventLog.innerHTML = '<li class="event-empty">No activity yet.</li>';
    return;
  }

  elements.eventLog.innerHTML = state.eventLog
    .map((entry) => `
      <li class="${entry.statusClass}">
        <strong>${escapeHtml(entry.title)}</strong>
        <small>${escapeHtml(entry.timestamp)} | ${escapeHtml(entry.message)}</small>
      </li>
    `)
    .join("");
}

function setResultLines(lines) {
  elements.resultContent.innerHTML = lines
    .map((line) => `<span class="response-line">${escapeHtml(line)}</span>`)
    .join("");
}

function currentRoute() {
  return ROUTES[state.selectedRoute];
}

function getRouteTargetPath() {
  const route = currentRoute();
  if (state.connectionMode === "local") {
    return route.label;
  }
  return normalizeRoutePath(state.liveConfig[route.liveField]);
}

function getIdleProofKeyStatus() {
  const route = currentRoute();
  if (route.type === "Public") {
    return "Not needed";
  }
  if (!state.apiKey.trim()) {
    return "Missing";
  }
  if (state.connectionMode === "local") {
    return state.apiKey === DEMO_KEYS.valid ? "Valid" : "Invalid";
  }
  return "Provided";
}

function buildIdleModel() {
  const route = currentRoute();
  const targetPath = getRouteTargetPath();
  const liveRouteConfigured = state.connectionMode === "live" && Boolean(targetPath);

  return {
    outcomeBadgeText: "Waiting",
    outcomeBadgeClass: "idle",
    outcomeSummary: state.connectionMode === "local"
      ? "No request has been sent yet."
      : "No live request has been sent yet.",
    proofMode: state.connectionMode === "local" ? "Local simulation" : "Live platform mode",
    currentOutcome: "No action yet",
    proofRouteType: route.type,
    proofKeyStatus: getIdleProofKeyStatus(),
    actionResult: state.connectionMode === "local" ? "Waiting for request" : "Waiting for gateway request",
    httpStatus: formatHttpStatus(state.lastHttpStatus),
    securityAction: "No request yet",
    securityReason: state.connectionMode === "local"
      ? "Choose a route and send a request."
      : "Choose a route and send a gateway request.",
    securityRoute: state.connectionMode === "local" ? route.label : (targetPath || "Live route not configured"),
    resultClass: "neutral",
    resultLines: state.connectionMode === "local"
      ? ["Waiting for a demo request."]
      : liveRouteConfigured
        ? ["Waiting for a live gateway request."]
        : ["Add a gateway URL and route path to use live mode."],
    keyCheckCard: route.type === "Public"
      ? "No key required for this route"
      : state.connectionMode === "local"
        ? "Waiting for staff key check"
        : "Gateway will check X-API-Key on the protected route",
    keyCheckCopy: route.type === "Public"
      ? "Public information stays open because it does not trigger a staff-only action."
      : state.connectionMode === "local"
        ? "This route changes something important, so the system will check for a valid staff key first."
        : "In live mode the real gateway decides whether the request can reach the service.",
    decisionCard: "Waiting for request",
    decisionCopy: state.connectionMode === "local"
      ? "Choose a route and send a request to see what happens."
      : "Use the same story, but now the real gateway decides the result.",
  };
}

function buildResultModel(overrides) {
  return {
    ...buildIdleModel(),
    ...overrides,
    httpStatus: formatHttpStatus(overrides.httpStatus ?? state.lastHttpStatus),
  };
}

function getViewModel() {
  return state.lastResult || buildIdleModel();
}

function summarizeBody(payload, fallbackStatus) {
  if (payload == null) {
    return [`HTTP ${fallbackStatus}`];
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return [trimmed || `HTTP ${fallbackStatus}`];
  }

  if (typeof payload === "object") {
    return Object.entries(payload)
      .slice(0, 5)
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
  }

  return [String(payload)];
}

function buildLocalResult() {
  if (state.selectedRoute === "public-help-hours") {
    state.allowedCount += 1;
    addLogEntry({
      title: "Public route allowed",
      message: "No key required for GET /public/help-hours",
      statusClass: "allowed",
    });
    state.lastHttpStatus = 200;
    return buildResultModel({
      outcomeBadgeText: "Allowed",
      outcomeBadgeClass: "allowed",
      outcomeSummary: "Public information was returned because this route is open to everyone.",
      currentOutcome: "Allowed",
      proofRouteType: "Public",
      proofKeyStatus: "Not needed",
      actionResult: "Help desk hours shown",
      httpStatus: 200,
      securityAction: "Allowed",
      securityReason: "Public route accessed successfully",
      securityRoute: ROUTES[state.selectedRoute].label,
      resultClass: "allowed",
      resultLines: [
        "Help Desk Hours: 9:00 AM - 5:00 PM",
        "Visitor Support Counter: Ground Floor",
      ],
      keyCheckCard: "No key required for this route",
      keyCheckCopy: "Public information can stay open because it does not trigger a staff-only action.",
      decisionCard: "Public information returned",
      decisionCopy: "The system allowed this request because it is public information for everyone.",
    });
  }

  if (!state.apiKey.trim()) {
    state.deniedCount += 1;
    addLogEntry({
      title: "Protected route denied",
      message: "Missing key blocked POST /staff/open-maintenance-panel",
      statusClass: "denied",
    });
    state.lastHttpStatus = 401;
    return buildResultModel({
      outcomeBadgeText: "Denied",
      outcomeBadgeClass: "denied",
      outcomeSummary: "The staff-only action was blocked because no access key was provided.",
      currentOutcome: "Access denied",
      proofRouteType: "Protected",
      proofKeyStatus: "Missing",
      actionResult: "Maintenance panel stayed locked",
      httpStatus: 401,
      securityAction: "Denied",
      securityReason: "No API key provided",
      securityRoute: ROUTES[state.selectedRoute].label,
      resultClass: "denied",
      resultLines: [
        "Maintenance Panel Status: Locked",
        "Reason: No access key provided. Staff-only action blocked.",
      ],
      keyCheckCard: "No access key provided",
      keyCheckCopy: "A public visitor can view public info, but cannot run this protected action without a valid key.",
      decisionCard: "Request denied before staff action can run",
      decisionCopy: "The door stays closed when no digital access card is shown.",
    });
  }

  if (state.apiKey === DEMO_KEYS.valid) {
    state.allowedCount += 1;
    addLogEntry({
      title: "Protected route allowed",
      message: "Valid staff key confirmed for POST /staff/open-maintenance-panel",
      statusClass: "allowed",
    });
    state.lastHttpStatus = 200;
    return buildResultModel({
      outcomeBadgeText: "Allowed",
      outcomeBadgeClass: "allowed",
      outcomeSummary: "The staff-only action was allowed because a valid access key was confirmed.",
      currentOutcome: "Allowed",
      proofRouteType: "Protected",
      proofKeyStatus: "Valid",
      actionResult: "Maintenance panel opened",
      httpStatus: 200,
      securityAction: "Allowed",
      securityReason: "Valid API key confirmed",
      securityRoute: ROUTES[state.selectedRoute].label,
      resultClass: "allowed",
      resultLines: [
        "Maintenance Panel Status: Open",
        "Authorized Staff Session: Granted",
      ],
      keyCheckCard: "Valid staff access key confirmed",
      keyCheckCopy: "The key works like a digital access card that proves the request is allowed to do this staff-only action.",
      decisionCard: "Protected action allowed",
      decisionCopy: "Sensitive actions should only work after verified access is confirmed.",
    });
  }

  state.deniedCount += 1;
  addLogEntry({
    title: "Protected route denied",
    message: "Invalid key blocked POST /staff/open-maintenance-panel",
    statusClass: "denied",
  });
  state.lastHttpStatus = 401;
  return buildResultModel({
    outcomeBadgeText: "Denied",
    outcomeBadgeClass: "denied",
    outcomeSummary: "A key was provided, but it did not match an authorized staff key.",
    currentOutcome: "Access denied",
    proofRouteType: "Protected",
    proofKeyStatus: "Invalid",
    actionResult: "Maintenance panel stayed locked",
    httpStatus: 401,
    securityAction: "Denied",
    securityReason: "Invalid API key",
    securityRoute: ROUTES[state.selectedRoute].label,
    resultClass: "denied",
    resultLines: [
      "Maintenance Panel Status: Locked",
      "Reason: The key was provided, but it is not authorized for this action.",
    ],
    keyCheckCard: "Key provided, but it is not authorized",
    keyCheckCopy: "The system is not just checking whether the field is filled. It checks whether the key is valid.",
    decisionCard: "Request denied after key check failed",
    decisionCopy: "Not every key-shaped value opens the staff-only door.",
  });
}

function setConnectionStatus(tone, message) {
  state.connectionStatus = { tone, message };
}

function buildLiveRequestUrl() {
  const route = currentRoute();
  const baseUrl = normalizeBaseUrl(state.liveConfig.gatewayBaseUrl);
  const path = normalizeRoutePath(state.liveConfig[route.liveField]);

  if (!baseUrl || !path) {
    return "";
  }

  return `${baseUrl}${path}`;
}

async function parseLiveResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function buildLiveSetupNeededResult(reason, lines, httpStatus) {
  state.lastHttpStatus = httpStatus;
  setConnectionStatus("warning", reason);
  addLogEntry({
    title: "Live setup needs attention",
    message: reason,
    statusClass: "warning",
  });
  return buildResultModel({
    outcomeBadgeText: "Check Setup",
    outcomeBadgeClass: "warning",
    outcomeSummary: reason,
    currentOutcome: "Setup needed",
    proofMode: "Live platform mode",
    proofRouteType: currentRoute().type,
    proofKeyStatus: currentRoute().type === "Public" ? "Not needed" : (state.apiKey.trim() ? "Provided" : "Missing"),
    actionResult: "Gateway setup needs attention",
    httpStatus,
    securityAction: "Check setup",
    securityReason: reason,
    securityRoute: getRouteTargetPath() || "Live route not configured",
    resultClass: "warning",
    resultLines: lines,
    keyCheckCard: "Live gateway configuration should be verified",
    keyCheckCopy: "This is still useful proof: the demo is talking to the real platform, but the route or API key setup needs adjustment.",
    decisionCard: "Live route needs setup",
    decisionCopy: "Check the gateway URL, deployed service name, route path, and API key protection settings in the platform.",
  });
}

function buildLiveDeniedResult(kind, payload, httpStatus) {
  const missing = kind === "missing";
  const reason = missing ? "No valid API key reached the protected route." : "The gateway rejected the provided API key.";

  state.deniedCount += 1;
  state.lastHttpStatus = httpStatus;
  setConnectionStatus("danger", `Live request denied by the gateway with HTTP ${httpStatus}.`);
  addLogEntry({
    title: "Live protected route denied",
    message: `${missing ? "Missing" : "Invalid"} key blocked ${getRouteTargetPath()}`,
    statusClass: "denied",
  });

  return buildResultModel({
    outcomeBadgeText: "Denied",
    outcomeBadgeClass: "denied",
    outcomeSummary: missing
      ? "The protected route was denied by the real gateway because no API key was provided."
      : "The protected route was denied by the real gateway because the API key was invalid.",
    currentOutcome: "Access denied",
    proofMode: "Live platform mode",
    proofRouteType: "Protected",
    proofKeyStatus: missing ? "Missing" : "Invalid",
    actionResult: "Gateway blocked the protected route",
    httpStatus,
    securityAction: "Denied",
    securityReason: reason,
    securityRoute: getRouteTargetPath(),
    resultClass: "denied",
    resultLines: summarizeBody(payload, httpStatus),
    keyCheckCard: missing ? "No X-API-Key header was provided" : "X-API-Key was provided, but the gateway did not accept it",
    keyCheckCopy: missing
      ? "This is real enforcement: the request never gets through to the protected action without a key."
      : "This proves the gateway checks whether the key is valid, not just whether the field is filled.",
    decisionCard: "Gateway denied the protected route",
    decisionCopy: missing
      ? "The staff-only door stayed closed because no access card was shown."
      : "The staff-only door stayed closed because the wrong access card was shown.",
  });
}

function buildLiveAllowedResult(payload, httpStatus) {
  state.allowedCount += 1;
  state.lastHttpStatus = httpStatus;
  setConnectionStatus("success", `Live request succeeded through the gateway with HTTP ${httpStatus}.`);
  addLogEntry({
    title: currentRoute().type === "Public" ? "Live public route allowed" : "Live protected route allowed",
    message: `Gateway forwarded ${getRouteTargetPath()} with HTTP ${httpStatus}`,
    statusClass: "allowed",
  });

  if (state.selectedRoute === "public-help-hours") {
    return buildResultModel({
      outcomeBadgeText: "Allowed",
      outcomeBadgeClass: "allowed",
      outcomeSummary: "The public route succeeded through the real gateway with no API key required.",
      currentOutcome: "Allowed",
      proofMode: "Live platform mode",
      proofRouteType: "Public",
      proofKeyStatus: "Not needed",
      actionResult: "Public route responded through the gateway",
      httpStatus,
      securityAction: "Allowed",
      securityReason: "Public route stayed open",
      securityRoute: getRouteTargetPath(),
      resultClass: "allowed",
      resultLines: summarizeBody(payload, httpStatus),
      keyCheckCard: "No key required for this live route",
      keyCheckCopy: "The real gateway let the request through because this route is intentionally public.",
      decisionCard: "Public route allowed",
      decisionCopy: "This proves security does not mean locking everything down.",
    });
  }

  return buildResultModel({
    outcomeBadgeText: "Allowed",
    outcomeBadgeClass: "allowed",
    outcomeSummary: "The protected route succeeded through the real gateway because a valid API key was accepted.",
    currentOutcome: "Allowed",
    proofMode: "Live platform mode",
    proofRouteType: "Protected",
    proofKeyStatus: "Valid",
    actionResult: "Protected route reached the service",
    httpStatus,
    securityAction: "Allowed",
    securityReason: "Valid API key confirmed by the gateway",
    securityRoute: getRouteTargetPath(),
    resultClass: "allowed",
    resultLines: summarizeBody(payload, httpStatus),
    keyCheckCard: "Gateway accepted the provided X-API-Key",
    keyCheckCopy: "The live platform allowed the request to reach the staff-only action only after the key passed validation.",
    decisionCard: "Protected route allowed",
    decisionCopy: "The staff-only door opened only after the real gateway verified the digital access card.",
  });
}

async function buildLiveResult() {
  const url = buildLiveRequestUrl();
  const route = currentRoute();

  if (!url) {
    return buildLiveSetupNeededResult(
      "Live mode needs a gateway base URL and route path before it can send traffic.",
      [
        "Add a gateway base URL like http://localhost:30080.",
        `Add the ${route.type.toLowerCase()} route path for the deployed service.`,
      ],
      null,
    );
  }

  const headers = {};
  if (state.apiKey.trim()) {
    headers["X-API-Key"] = state.apiKey.trim();
  }

  try {
    const response = await fetch(url, {
      method: route.method,
      headers,
    });
    const payload = await parseLiveResponse(response);

    if (route.type === "Public") {
      if (response.ok) {
        return buildLiveAllowedResult(payload, response.status);
      }

      if (response.status === 401) {
        return buildLiveSetupNeededResult(
          "The route chosen as public is being blocked by API key protection right now.",
          [
            "Leave the public route unchecked in the platform API key settings.",
            ...summarizeBody(payload, response.status),
          ],
          response.status,
        );
      }

      return buildLiveSetupNeededResult(
        "The public route did not respond successfully through the gateway.",
        summarizeBody(payload, response.status),
        response.status,
      );
    }

    if (response.status === 401) {
      return buildLiveDeniedResult(state.apiKey.trim() ? "invalid" : "missing", payload, response.status);
    }

    if (response.ok) {
      if (!state.apiKey.trim()) {
        return buildLiveSetupNeededResult(
          "The protected route succeeded without an API key, so gateway protection is not set the way the demo expects.",
          [
            "Protect the POST route in the platform auth tab.",
            ...summarizeBody(payload, response.status),
          ],
          response.status,
        );
      }

      return buildLiveAllowedResult(payload, response.status);
    }

    return buildLiveSetupNeededResult(
      "The live protected route returned an unexpected response.",
      summarizeBody(payload, response.status),
      response.status,
    );
  } catch (error) {
    return buildLiveSetupNeededResult(
      "The browser could not reach the live gateway route.",
      [
        `Target URL: ${url}`,
        `Error: ${error.message}`,
      ],
      null,
    );
  }
}

function render() {
  const route = currentRoute();
  const view = getViewModel();

  elements.routeTypeBadge.textContent = `${route.type} Route`;
  elements.routeTypeBadge.className = `route-type-badge ${route.badgeClass}`;
  elements.selectedRouteCard.textContent = state.connectionMode === "local" ? route.label : (getRouteTargetPath() || `Missing ${route.type.toLowerCase()} live route`);
  elements.routeStory.textContent = route.story;
  elements.keyHint.textContent = state.connectionMode === "local"
    ? route.keyHint
    : route.type === "Public"
      ? "This live route should stay open through the real gateway."
      : "This live route should require X-API-Key before the gateway lets it through.";
  elements.keyHint.className = `field-hint ${route.badgeClass === "public" ? "public-hint" : "protected-hint"}`;
  elements.keyCheckCard.textContent = view.keyCheckCard;
  elements.keyCheckCopy.textContent = view.keyCheckCopy;
  elements.decisionCard.textContent = view.decisionCard;
  elements.decisionCopy.textContent = view.decisionCopy;
  elements.outcomeBadge.textContent = view.outcomeBadgeText;
  elements.outcomeBadge.className = `outcome-badge ${view.outcomeBadgeClass}`;
  elements.outcomeSummary.textContent = view.outcomeSummary;
  elements.proofMode.textContent = view.proofMode;
  elements.currentOutcome.textContent = view.currentOutcome;
  elements.proofRouteType.textContent = view.proofRouteType;
  elements.proofKeyStatus.textContent = view.proofKeyStatus;
  elements.actionResult.textContent = view.actionResult;
  elements.httpStatus.textContent = view.httpStatus;
  elements.securityAction.textContent = view.securityAction;
  elements.securityReason.textContent = view.securityReason;
  elements.securityRoute.textContent = view.securityRoute;
  elements.resultCard.className = `result-card ${view.resultClass}`;
  elements.allowedCount.textContent = state.allowedCount;
  elements.deniedCount.textContent = state.deniedCount;
  setResultLines(view.resultLines);
  renderEventLog();

  elements.connectionModeBadge.textContent = state.connectionMode === "local" ? "Local Simulation" : "Live Platform Mode";
  elements.connectionModeBadge.className = `mode-badge ${state.connectionMode}`;
  elements.connectionModeSelect.value = state.connectionMode;
  elements.liveConfigFields.hidden = state.connectionMode !== "live";
  elements.gatewayBaseUrlInput.value = state.liveConfig.gatewayBaseUrl;
  elements.publicRouteInput.value = state.liveConfig.publicRoute;
  elements.protectedRouteInput.value = state.liveConfig.protectedRoute;
  elements.connectionStatusCard.textContent = state.connectionStatus.message;
  elements.connectionStatusCard.className = `connection-status-card ${state.connectionStatus.tone}`;
  elements.demoKeyReference.hidden = state.connectionMode !== "local";
  elements.apiKeyInput.placeholder = state.connectionMode === "local"
    ? "Enter staff key for protected action"
    : "Enter the real API key from the platform";
  elements.validKeyButton.textContent = state.connectionMode === "local" ? "Use Valid Staff Key" : "Use Entered Live Key";
  elements.sendRequestButton.disabled = state.requestInFlight;
  elements.sendRequestButton.textContent = state.requestInFlight
    ? (state.connectionMode === "local" ? "Sending..." : "Calling Gateway...")
    : "Send Request";
}

async function handleRequest() {
  state.lastResult = null;
  state.requestInFlight = true;
  render();

  state.lastResult = state.connectionMode === "local"
    ? buildLocalResult()
    : await buildLiveResult();

  state.requestInFlight = false;
  render();
}

function resetDemo() {
  state.selectedRoute = "public-help-hours";
  state.apiKey = "";
  state.allowedCount = 0;
  state.deniedCount = 0;
  state.eventLog = [];
  state.lastHttpStatus = null;
  state.lastResult = null;
  state.requestInFlight = false;
  setConnectionStatus(
    "info",
    state.connectionMode === "local"
      ? "Local simulation is ready. Switch to live mode after a real service is deployed behind the gateway."
      : "Live mode is ready. Use the deployed gateway routes to test public and protected behavior."
  );

  elements.routeSelect.value = state.selectedRoute;
  elements.apiKeyInput.value = "";
  render();
}

function resetLatestResult() {
  state.lastResult = null;
  state.lastHttpStatus = null;
}

elements.connectionModeSelect.addEventListener("change", (event) => {
  state.connectionMode = event.target.value;
  resetLatestResult();
  setConnectionStatus(
    state.connectionMode === "local" ? "info" : "warning",
    state.connectionMode === "local"
      ? "Local simulation is ready. Switch to live mode after a real service is deployed behind the gateway."
      : "Live mode uses the real gateway. If the route or key setup is incomplete, the proof panel will explain what to fix."
  );
  render();
});

elements.gatewayBaseUrlInput.addEventListener("input", (event) => {
  state.liveConfig.gatewayBaseUrl = event.target.value;
  resetLatestResult();
  render();
});

elements.publicRouteInput.addEventListener("input", (event) => {
  state.liveConfig.publicRoute = event.target.value;
  resetLatestResult();
  render();
});

elements.protectedRouteInput.addEventListener("input", (event) => {
  state.liveConfig.protectedRoute = event.target.value;
  resetLatestResult();
  render();
});

elements.liveDefaultsButton.addEventListener("click", () => {
  state.liveConfig = { ...LIVE_DEFAULTS };
  resetLatestResult();
  setConnectionStatus("info", "Live defaults loaded for the simulation-owned expo target service.");
  render();
});

elements.routeSelect.addEventListener("change", (event) => {
  state.selectedRoute = event.target.value;
  resetLatestResult();
  render();
});

elements.apiKeyInput.addEventListener("input", (event) => {
  state.apiKey = event.target.value;
  resetLatestResult();
  render();
});

elements.noKeyButton.addEventListener("click", () => {
  state.apiKey = "";
  elements.apiKeyInput.value = "";
  resetLatestResult();
  render();
});

elements.validKeyButton.addEventListener("click", () => {
  if (state.connectionMode === "local") {
    state.apiKey = DEMO_KEYS.valid;
    elements.apiKeyInput.value = DEMO_KEYS.valid;
  } else {
    state.apiKey = elements.apiKeyInput.value;
  }
  resetLatestResult();
  render();
});

elements.wrongKeyButton.addEventListener("click", () => {
  state.apiKey = DEMO_KEYS.wrong;
  elements.apiKeyInput.value = DEMO_KEYS.wrong;
  resetLatestResult();
  render();
});

elements.sendRequestButton.addEventListener("click", handleRequest);
elements.resetButton.addEventListener("click", resetDemo);

render();

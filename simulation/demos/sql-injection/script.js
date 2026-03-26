const NORMAL_USER = {
  username: "admin",
  password: "admin123",
};

const ATTACK_USER = {
  username: "admin",
  password: "' OR '1'='1",
};

const LIVE_DEFAULTS = {
  gatewayBaseUrl: "http://localhost:30080",
  loginRoute: "/expo-sqli-demo/login",
  platformApiBase: "http://localhost:30000/api",
};

const state = {
  protectionEnabled: false,
  blockedCount: 0,
  requestCount: 0,
  activityLog: [],
  connectionMode: "local",
  liveConfig: { ...LIVE_DEFAULTS },
  connectionStatus: {
    tone: "info",
    message: "Local simulation is ready. Switch to live mode after the SQL injection target service is deployed behind the gateway.",
  },
  requestInFlight: false,
  liveProof: {
    serviceName: "",
    source: "Gateway response only",
    sqliBlocks: null,
    latestEvent: "",
  },
  currentView: null,
};

const elements = {
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  protectionPill: document.getElementById("protectionPill"),
  toggleProtectionButton: document.getElementById("toggleProtectionButton"),
  resetButton: document.getElementById("resetButton"),
  fillNormalButton: document.getElementById("fillNormalButton"),
  fillAttackButton: document.getElementById("fillAttackButton"),
  loginButton: document.getElementById("loginButton"),
  connectionModeBadge: document.getElementById("connectionModeBadge"),
  connectionModeSelect: document.getElementById("connectionModeSelect"),
  liveConfigFields: document.getElementById("liveConfigFields"),
  gatewayBaseUrlInput: document.getElementById("gatewayBaseUrlInput"),
  loginRouteInput: document.getElementById("loginRouteInput"),
  platformApiBaseInput: document.getElementById("platformApiBaseInput"),
  liveDefaultsButton: document.getElementById("liveDefaultsButton"),
  connectionStatusCard: document.getElementById("connectionStatusCard"),
  resultBanner: document.getElementById("resultBanner"),
  inputSummary: document.getElementById("inputSummary"),
  querySummary: document.getElementById("querySummary"),
  decisionSummary: document.getElementById("decisionSummary"),
  protectionExplanation: document.getElementById("protectionExplanation"),
  proofBadge: document.getElementById("proofBadge"),
  currentOutcome: document.getElementById("currentOutcome"),
  attackStatus: document.getElementById("attackStatus"),
  accessGranted: document.getElementById("accessGranted"),
  blockedCount: document.getElementById("blockedCount"),
  eventThreat: document.getElementById("eventThreat"),
  eventField: document.getElementById("eventField"),
  eventAction: document.getElementById("eventAction"),
  eventReason: document.getElementById("eventReason"),
  proofExplanation: document.getElementById("proofExplanation"),
  liveProofCard: document.getElementById("liveProofCard"),
  liveProofService: document.getElementById("liveProofService"),
  liveProofBlocks: document.getElementById("liveProofBlocks"),
  liveProofEvent: document.getElementById("liveProofEvent"),
  liveProofSource: document.getElementById("liveProofSource"),
  activityLog: document.getElementById("activityLog"),
  requestCount: document.getElementById("requestCount"),
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

function isAttackPayload(value) {
  return /^'\s*or\s*'1'\s*=\s*'1$/i.test(value);
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

function inferServiceName(loginRoute) {
  const normalized = normalizeRoutePath(loginRoute);
  if (!normalized) {
    return "";
  }
  const parts = normalized.split("/").filter(Boolean);
  return parts[0] || "";
}

function buildGatewayUrl() {
  const baseUrl = normalizeBaseUrl(state.liveConfig.gatewayBaseUrl);
  const loginRoute = normalizeRoutePath(state.liveConfig.loginRoute);
  if (!baseUrl || !loginRoute) {
    return "";
  }
  return `${baseUrl}${loginRoute}`;
}

function prependLog(kind, title, message) {
  state.activityLog.unshift({
    kind,
    title,
    message,
    timeLabel: createTimestamp(),
  });

  state.activityLog = state.activityLog.slice(0, 8);
}

function setConnectionStatus(tone, message) {
  state.connectionStatus = { tone, message };
}

function idleView() {
  const liveConfigured = Boolean(buildGatewayUrl());
  const modeLabel = state.connectionMode === "local" ? "local simulation" : "live gateway";
  return {
    bannerKind: "idle",
    bannerTitle: "Waiting for login attempt",
    bannerDescription: state.connectionMode === "local"
      ? "No action yet. Choose a safe login or the malicious demo input."
      : "No live request yet. Add the gateway settings, then test a normal login or the attack payload.",
    inputHtml: state.connectionMode === "local"
      ? "No request yet."
      : `Mode: live gateway<br>Target: ${escapeHtml(buildGatewayUrl() || "Not configured")}`,
    queryHtml: liveConfigured
      ? "Waiting for a live gateway request."
      : "Add a gateway URL and login route to use live mode.",
    decisionText: state.connectionMode === "local"
      ? "The app has not processed anything yet."
      : "The demo is ready to send a real request through the gateway as soon as the live target is configured.",
    proofBadgeClass: "neutral",
    proofBadgeText: "No action yet",
    currentOutcome: "Waiting for login attempt",
    attackStatus: "None",
    accessGranted: "No access yet",
    eventThreat: "None",
    eventField: "None",
    eventAction: "Waiting",
    eventReason: state.connectionMode === "local" ? "No request yet" : "No gateway request yet",
    proofExplanation: state.connectionMode === "local"
      ? "The proof panel will show either unauthorized access in vulnerable mode or a blocked security event in protected mode."
      : "Live mode keeps the same story, but now the real gateway response decides whether the login succeeds or gets blocked.",
  };
}

function buildLocalView(username, password) {
  if (username === NORMAL_USER.username && password === NORMAL_USER.password) {
    prependLog("allowed", "Normal Login | Allowed", "admin signed in successfully with the correct password.");
    return {
      bannerKind: "success",
      bannerTitle: "Login successful",
      bannerDescription: "A real user got in with the correct password.",
      inputHtml: `Username: ${escapeHtml(username)}<br>Password: ${escapeHtml(password)}`,
      queryHtml: "SELECT * FROM users WHERE username = 'admin' AND password = 'admin123'",
      decisionText: "The login matches a real user account, so access is granted normally.",
      proofBadgeClass: "allowed",
      proofBadgeText: "Allowed",
      currentOutcome: "Allowed",
      attackStatus: "No attack detected",
      accessGranted: "Admin Dashboard",
      eventThreat: "None",
      eventField: "None",
      eventAction: "Allowed",
      eventReason: "Clean request passed",
      proofExplanation: "Normal login worked as expected. This shows that protection does not block legitimate users.",
    };
  }

  if (isAttackPayload(password) && username === ATTACK_USER.username) {
    if (state.protectionEnabled) {
      state.blockedCount += 1;
      prependLog("blocked", "SQL Injection | Blocked", "Suspicious payload was detected in the password field before access was granted.");
      return {
        bannerKind: "danger",
        bannerTitle: "Login blocked",
        bannerDescription: "Suspicious input was stopped before it could change the login logic.",
        inputHtml: `Username: ${escapeHtml(username)}<br>Password: <span class="highlight-bad">${escapeHtml(password)}</span>`,
        queryHtml: "Suspicious pattern detected in password input.<br>Request blocked before any unsafe query can run.",
        decisionText: "The protected flow recognizes the payload as a SQL injection attempt and denies access before the trick can reach the database logic.",
        proofBadgeClass: "blocked",
        proofBadgeText: "Attack blocked",
        currentOutcome: "Attack blocked",
        attackStatus: "SQL injection attempt detected",
        accessGranted: "No access granted",
        eventThreat: "SQL Injection",
        eventField: "Password",
        eventAction: "Blocked",
        eventReason: "Suspicious login payload",
        proofExplanation: "This is the proof of protection: the same malicious input is blocked and no dashboard access is granted.",
      };
    }

    prependLog("vulnerable", "SQL Injection | Allowed", "Malicious input bypassed the weak login and opened the dashboard without the real password.");
    return {
      bannerKind: "warning",
      bannerTitle: "Login successful",
      bannerDescription: "Access granted by manipulated input. This login succeeded without the correct password.",
      inputHtml: `Username: ${escapeHtml(username)}<br>Password: <span class="highlight-bad">${escapeHtml(password)}</span>`,
      queryHtml: `SELECT * FROM users WHERE username = 'admin' AND password = '<span class="highlight-bad">' OR '1'='1</span>'`,
      decisionText: "Because '1'='1' is always true, the weak app treats the login check like a valid match and opens the dashboard.",
      proofBadgeClass: "vulnerable",
      proofBadgeText: "Unauthorized access allowed",
      currentOutcome: "Unauthorized access allowed",
      attackStatus: "Attack succeeded",
      accessGranted: "Admin Dashboard (unauthorized)",
      eventThreat: "SQL Injection",
      eventField: "Password",
      eventAction: "Allowed",
      eventReason: "No blocking protection",
      proofExplanation: "This is the proof of failure: the attacker reached the dashboard even though no real password was used.",
    };
  }

  prependLog("invalid", "Invalid Login | Denied", "The login attempt did not match the supported demo credentials.");
  return {
    bannerKind: "idle",
    bannerTitle: "Invalid username or password",
    bannerDescription: "Only the supported demo inputs create the normal or malicious demo paths.",
    inputHtml: `Username: ${escapeHtml(username || "(empty)")}<br>Password: ${escapeHtml(password || "(empty)")}`,
    queryHtml: "The input does not match the supported demo cases.",
    decisionText: "The simulation denies the login because the credentials are not the approved normal pair or the approved attack payload.",
    proofBadgeClass: "neutral",
    proofBadgeText: "Invalid login attempt",
    currentOutcome: "Invalid login attempt",
    attackStatus: "No successful attack",
    accessGranted: "No access granted",
    eventThreat: "None",
    eventField: "None",
    eventAction: "Denied",
    eventReason: "Unsupported demo input",
    proofExplanation: "This is a safe fallback path for any manual input outside the supported demo cases.",
  };
}

async function parseResponseBody(response) {
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

function summarizePayload(payload) {
  if (payload == null) {
    return "";
  }
  if (typeof payload === "string") {
    return payload.trim();
  }
  if (typeof payload === "object") {
    return Object.entries(payload)
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join(" | ");
  }
  return String(payload);
}

async function refreshLiveProof() {
  const apiBase = normalizeBaseUrl(state.liveConfig.platformApiBase);
  const serviceName = inferServiceName(state.liveConfig.loginRoute);

  state.liveProof = {
    serviceName: serviceName || "",
    source: "Gateway response only",
    sqliBlocks: null,
    latestEvent: "",
  };

  if (!apiBase || !serviceName) {
    return;
  }

  try {
    const [statsResponse, eventsResponse] = await Promise.all([
      fetch(`${apiBase}/services/${serviceName}/waf/stats`),
      fetch(`${apiBase}/services/${serviceName}/waf/events?limit=5`),
    ]);

    if (!statsResponse.ok || !eventsResponse.ok) {
      state.liveProof.source = "Gateway response only";
      return;
    }

    const statsPayload = await statsResponse.json();
    const eventsPayload = await eventsResponse.json();
    const latestEvent = Array.isArray(eventsPayload.events) ? eventsPayload.events[0] : null;

    state.liveProof.source = "Gateway WAF stats + events";
    state.liveProof.sqliBlocks = statsPayload.by_type?.sqli ?? 0;
    state.liveProof.latestEvent = latestEvent
      ? `${latestEvent.attack_type || "unknown"} on ${latestEvent.field || "unknown field"}`
      : "No blocked event recorded yet";
  } catch (error) {
    state.liveProof.source = "Gateway response only";
  }
}

function buildLiveSetupView(reason, queryHtml, title = "Live mode needs setup") {
  prependLog("invalid", "Live Mode | Setup Needed", reason);
  setConnectionStatus("warning", reason);
  return {
    bannerKind: "idle",
    bannerTitle: title,
    bannerDescription: reason,
    inputHtml: `Mode: live gateway<br>Target: ${escapeHtml(buildGatewayUrl() || "Not configured")}`,
    queryHtml,
    decisionText: "The demo is still working safely, but the live route or platform proof source needs attention before the real request path can be demonstrated.",
    proofBadgeClass: "neutral",
    proofBadgeText: "Check live setup",
    currentOutcome: "Setup needed",
    attackStatus: "No proof yet",
    accessGranted: "No access granted",
    eventThreat: "None",
    eventField: "None",
    eventAction: "Check setup",
    eventReason: reason,
    proofExplanation: "This keeps the demo graceful: the polished UI stays usable even if the live target or gateway is not ready.",
  };
}

function buildLiveBlockedView(username, password, payload, httpStatus) {
  state.blockedCount += 1;
  prependLog("blocked", "SQL Injection | Blocked By Gateway", `The real gateway returned HTTP ${httpStatus} and stopped the malicious login payload.`);
  setConnectionStatus("success", `Live gateway blocked the SQL injection payload with HTTP ${httpStatus}.`);
  return {
    bannerKind: "danger",
    bannerTitle: "Login blocked",
    bannerDescription: "The real gateway recognized the malicious payload and blocked the request before the service could accept it.",
    inputHtml: `Mode: live gateway<br>Username: ${escapeHtml(username)}<br>Password: <span class="highlight-bad">${escapeHtml(password)}</span>`,
    queryHtml: escapeHtml(summarizePayload(payload) || "Gateway returned a SQL injection block response before the login service ran."),
    decisionText: "This is the real platform path: the payload went to the gateway route, the WAF inspected the request body, and the request was denied before it could reach the backend service.",
    proofBadgeClass: "blocked",
    proofBadgeText: "Attack blocked",
    currentOutcome: "Attack blocked",
    attackStatus: "SQL injection attempt detected",
    accessGranted: "No access granted",
    eventThreat: "SQL Injection",
    eventField: "Password body field",
    eventAction: "Blocked",
    eventReason: typeof payload === "object" && payload?.reason ? payload.reason : "Blocked by gateway WAF",
    proofExplanation: "This is live proof from the real platform path: the gateway stopped the same malicious input before any vulnerable login behavior could happen.",
  };
}

function buildLiveNormalSuccessView(username, payload, httpStatus) {
  prependLog("allowed", "Normal Login | Live Allowed", `The real gateway forwarded the normal login and the service returned HTTP ${httpStatus}.`);
  setConnectionStatus("success", `Live login succeeded through the gateway with HTTP ${httpStatus}.`);
  return {
    bannerKind: "success",
    bannerTitle: "Login successful",
    bannerDescription: "The normal credentials passed through the real gateway and the service accepted them.",
    inputHtml: `Mode: live gateway<br>Username: ${escapeHtml(username)}<br>Password: ${escapeHtml(NORMAL_USER.password)}`,
    queryHtml: escapeHtml(payload?.query_preview || "Live service accepted the normal login request."),
    decisionText: "Security still allows normal use. The gateway forwarded a clean request and the service returned a successful login.",
    proofBadgeClass: "allowed",
    proofBadgeText: "Allowed",
    currentOutcome: "Allowed",
    attackStatus: "Normal request",
    accessGranted: payload?.access_granted_to || "Admin Dashboard",
    eventThreat: "None",
    eventField: "None",
    eventAction: "Allowed",
    eventReason: "Clean gateway request passed",
    proofExplanation: "This proves live mode does not just block traffic. Normal credentials still work through the real gateway path.",
  };
}

function buildLiveAttackSuccessView(username, password, payload, httpStatus) {
  prependLog("vulnerable", "SQL Injection | Live Allowed", `The live service returned HTTP ${httpStatus} and granted access after the payload reached it.`);
  setConnectionStatus("warning", `Live gateway forwarded the payload with HTTP ${httpStatus}. This means SQLi protection is currently OFF for this route.`);
  return {
    bannerKind: "warning",
    bannerTitle: "Login successful",
    bannerDescription: "The attack payload reached the live service through the gateway and the weak login logic granted access without the real password.",
    inputHtml: `Mode: live gateway<br>Username: ${escapeHtml(username)}<br>Password: <span class="highlight-bad">${escapeHtml(password)}</span>`,
    queryHtml: payload?.query_preview
      ? escapeHtml(payload.query_preview)
      : `POST ${escapeHtml(buildGatewayUrl() || "gateway route")} accepted the payload and returned a bypass-style success.`,
    decisionText: "This is the real vulnerable path for the expo: the gateway let the request through, and the intentionally permissive demo service treated the payload like a successful login bypass.",
    proofBadgeClass: "vulnerable",
    proofBadgeText: "Unauthorized access allowed",
    currentOutcome: "Unauthorized access allowed",
    attackStatus: "Attack succeeded",
    accessGranted: payload?.access_granted_to || "Admin Dashboard (unauthorized)",
    eventThreat: "SQL Injection",
    eventField: "Password",
    eventAction: "Allowed",
    eventReason: payload?.proof || "Gateway did not block the malicious payload",
    proofExplanation: "This is live proof of the unprotected case: the request still used the real gateway route, but SQLi protection was not enabled so the weak target service was reached.",
  };
}

function buildLiveInvalidView(username, password, payload, httpStatus) {
  prependLog("invalid", "Live Login | Denied", `The live service returned HTTP ${httpStatus} for credentials that do not match the expected demo cases.`);
  setConnectionStatus("info", `Live request reached the service, but the credentials were denied with HTTP ${httpStatus}.`);
  return {
    bannerKind: "idle",
    bannerTitle: "Invalid username or password",
    bannerDescription: "The request reached the live service, but it was not accepted as a normal login or the supported SQLi bypass case.",
    inputHtml: `Mode: live gateway<br>Username: ${escapeHtml(username || "(empty)")}<br>Password: ${escapeHtml(password || "(empty)")}`,
    queryHtml: escapeHtml(summarizePayload(payload) || "The live login target denied the request."),
    decisionText: "This still proves the gateway path is connected, but the returned outcome is just a normal failed login rather than the demo's success or attack story.",
    proofBadgeClass: "neutral",
    proofBadgeText: "Invalid login attempt",
    currentOutcome: "Invalid login attempt",
    attackStatus: "No successful attack",
    accessGranted: "No access granted",
    eventThreat: "None",
    eventField: "None",
    eventAction: "Denied",
    eventReason: "Live service denied the login",
    proofExplanation: "This graceful fallback keeps the UI understandable even when the live target returns a plain failed login.",
  };
}

async function buildLiveView(username, password) {
  const url = buildGatewayUrl();

  if (!url) {
    return buildLiveSetupView(
      "Live mode needs a gateway base URL and login route before it can send traffic.",
      "Add values like http://localhost:30080 and /expo-sqli-demo/login to use the real gateway path."
    );
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const payload = await parseResponseBody(response);

    await refreshLiveProof();

    if (response.status === 403 && typeof payload === "object" && payload?.attack_type === "sqli") {
      return buildLiveBlockedView(username, password, payload, response.status);
    }

    if (response.ok && typeof payload === "object" && payload?.auth_mode === "normal") {
      return buildLiveNormalSuccessView(username, payload, response.status);
    }

    if (response.ok && typeof payload === "object" && payload?.auth_mode === "bypass") {
      return buildLiveAttackSuccessView(username, password, payload, response.status);
    }

    if (response.status === 401 || (typeof payload === "object" && payload?.result === "denied")) {
      return buildLiveInvalidView(username, password, payload, response.status);
    }

    return buildLiveSetupView(
      `The live route responded with HTTP ${response.status}, but not in the expected expo demo format.`,
      escapeHtml(summarizePayload(payload) || "Unexpected live response")
    );
  } catch (error) {
    return buildLiveSetupView(
      "The browser could not reach the live gateway route.",
      `Target URL: ${escapeHtml(url)}<br>Error: ${escapeHtml(error.message)}`
    );
  }
}

function renderProtectionState() {
  if (state.protectionEnabled) {
    elements.protectionPill.textContent = "Protection ON";
    elements.protectionPill.className = "protection-pill protected";
    elements.toggleProtectionButton.textContent = "Turn Protection OFF";
    elements.protectionExplanation.textContent =
      state.connectionMode === "local"
        ? "Protection is ON right now, so suspicious input is flagged and blocked before an unsafe query can change the login logic."
        : "Protection is ON for the story. In live mode, the real outcome still depends on whether SQLi protection is enabled for the deployed service in the main platform.";
  } else {
    elements.protectionPill.textContent = "Protection OFF";
    elements.protectionPill.className = "protection-pill vulnerable";
    elements.toggleProtectionButton.textContent = "Turn Protection ON";
    elements.protectionExplanation.textContent =
      state.connectionMode === "local"
        ? "Protection is OFF right now, so the demo shows what happens when a weak login treats raw input as part of the database logic."
        : "Protection is OFF for the local story. In live mode, use the platform WAF toggle for the deployed service to create the vulnerable-versus-blocked difference.";
  }
}

function renderView() {
  const view = state.currentView || idleView();
  elements.resultBanner.className = `result-banner ${view.bannerKind}`;
  elements.resultBanner.innerHTML = `<strong>${view.bannerTitle}</strong><p>${view.bannerDescription}</p>`;
  elements.inputSummary.innerHTML = view.inputHtml;
  elements.querySummary.innerHTML = view.queryHtml;
  elements.decisionSummary.textContent = view.decisionText;
  elements.proofBadge.className = `proof-badge ${view.proofBadgeClass}`;
  elements.proofBadge.textContent = view.proofBadgeText;
  elements.currentOutcome.textContent = view.currentOutcome;
  elements.attackStatus.textContent = view.attackStatus;
  elements.accessGranted.textContent = view.accessGranted;
  elements.eventThreat.textContent = view.eventThreat;
  elements.eventField.textContent = view.eventField;
  elements.eventAction.textContent = view.eventAction;
  elements.eventReason.textContent = view.eventReason;
  elements.proofExplanation.textContent = view.proofExplanation;
}

function renderActivityLog() {
  if (state.activityLog.length === 0) {
    elements.activityLog.innerHTML = '<p class="empty-log">No activity yet.</p>';
    return;
  }

  elements.activityLog.innerHTML = state.activityLog
    .map((entry) => `
      <article class="log-entry ${entry.kind}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.message)}</span>
        <span>${escapeHtml(entry.timeLabel)}</span>
      </article>
    `)
    .join("");
}

function renderConnectionState() {
  elements.connectionModeBadge.textContent = state.connectionMode === "local" ? "Local Simulation" : "Live Gateway Mode";
  elements.connectionModeBadge.className = `mode-badge ${state.connectionMode}`;
  elements.connectionModeSelect.value = state.connectionMode;
  elements.liveConfigFields.hidden = state.connectionMode !== "live";
  elements.gatewayBaseUrlInput.value = state.liveConfig.gatewayBaseUrl;
  elements.loginRouteInput.value = state.liveConfig.loginRoute;
  elements.platformApiBaseInput.value = state.liveConfig.platformApiBase;
  elements.connectionStatusCard.textContent = state.connectionStatus.message;
  elements.connectionStatusCard.className = `connection-status-card ${state.connectionStatus.tone}`;
  elements.loginButton.disabled = state.requestInFlight;
  elements.loginButton.textContent = state.requestInFlight
    ? (state.connectionMode === "local" ? "Logging in..." : "Calling Gateway...")
    : "Login";

  const hasLiveProof = state.connectionMode === "live";
  elements.liveProofCard.hidden = !hasLiveProof;
  if (hasLiveProof) {
    elements.liveProofService.textContent = state.liveProof.serviceName || inferServiceName(state.liveConfig.loginRoute) || "Not configured";
    elements.liveProofBlocks.textContent = state.liveProof.sqliBlocks == null ? "Unknown" : String(state.liveProof.sqliBlocks);
    elements.liveProofEvent.textContent = state.liveProof.latestEvent || "No live event loaded";
    elements.liveProofSource.textContent = state.liveProof.source;
  }
}

function render() {
  renderProtectionState();
  renderView();
  renderActivityLog();
  renderConnectionState();
  elements.blockedCount.textContent = String(state.blockedCount);
  elements.requestCount.textContent = `${state.requestCount} request${state.requestCount === 1 ? "" : "s"}`;
}

function resetResultState() {
  state.currentView = null;
  if (state.connectionMode === "local") {
    state.liveProof = {
      serviceName: "",
      source: "Gateway response only",
      sqliBlocks: null,
      latestEvent: "",
    };
  }
}

function resetDemo() {
  elements.usernameInput.value = "";
  elements.passwordInput.value = "";
  resetResultState();
  setConnectionStatus(
    state.connectionMode === "local" ? "info" : "warning",
    state.connectionMode === "local"
      ? "Local simulation is ready. Switch to live mode after the SQL injection target service is deployed behind the gateway."
      : "Live mode is ready. Use the deployed gateway route to compare normal logins against the SQL injection payload."
  );
  render();
}

async function handleLogin() {
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value.trim();

  state.requestCount += 1;
  state.requestInFlight = true;
  render();

  state.currentView = state.connectionMode === "local"
    ? buildLocalView(username, password)
    : await buildLiveView(username, password);

  state.requestInFlight = false;
  render();
}

elements.fillNormalButton.addEventListener("click", () => {
  elements.usernameInput.value = NORMAL_USER.username;
  elements.passwordInput.value = NORMAL_USER.password;
});

elements.fillAttackButton.addEventListener("click", () => {
  elements.usernameInput.value = ATTACK_USER.username;
  elements.passwordInput.value = ATTACK_USER.password;
});

[elements.usernameInput, elements.passwordInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      elements.loginButton.click();
    }
  });
});

elements.toggleProtectionButton.addEventListener("click", () => {
  state.protectionEnabled = !state.protectionEnabled;
  resetResultState();
  render();
});

elements.resetButton.addEventListener("click", resetDemo);
elements.loginButton.addEventListener("click", handleLogin);

elements.connectionModeSelect.addEventListener("change", (event) => {
  state.connectionMode = event.target.value;
  resetResultState();
  setConnectionStatus(
    state.connectionMode === "local" ? "info" : "warning",
    state.connectionMode === "local"
      ? "Local simulation is ready. Switch to live mode after the SQL injection target service is deployed behind the gateway."
      : "Live mode uses the real gateway. If the target service or WAF setup is incomplete, the proof panel will explain what to fix."
  );
  render();
});

elements.gatewayBaseUrlInput.addEventListener("input", (event) => {
  state.liveConfig.gatewayBaseUrl = event.target.value;
  resetResultState();
  render();
});

elements.loginRouteInput.addEventListener("input", (event) => {
  state.liveConfig.loginRoute = event.target.value;
  resetResultState();
  render();
});

elements.platformApiBaseInput.addEventListener("input", (event) => {
  state.liveConfig.platformApiBase = event.target.value;
  resetResultState();
  render();
});

elements.liveDefaultsButton.addEventListener("click", () => {
  state.liveConfig = { ...LIVE_DEFAULTS };
  resetResultState();
  setConnectionStatus("info", "Live defaults loaded for the simulation-owned SQL injection target service.");
  render();
});

render();

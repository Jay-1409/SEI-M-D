const DEMO_KEYS = {
  valid: "STAFF-ACCESS-DEMO-2026",
  wrong: "STAFF-KEY-DEMO-WRONG",
};

const ROUTES = {
  "public-help-hours": {
    label: "GET /public/help-hours",
    type: "Public",
    badgeClass: "public",
    story: "This route is like a lobby notice board. Visitors can read it without a staff key.",
    keyHint: "This route is open to everyone. No access key is needed.",
  },
  "protected-maintenance-panel": {
    label: "POST /staff/open-maintenance-panel",
    type: "Protected",
    badgeClass: "protected",
    story: "This route is a staff-only action. The system checks for a valid digital access card before it can run.",
    keyHint: "This route needs a valid staff access key before the staff-only action can happen.",
  },
};

const state = {
  selectedRoute: "public-help-hours",
  apiKey: "",
  mode: "idle",
  allowedCount: 0,
  deniedCount: 0,
  eventLog: [],
};

const elements = {
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
  currentOutcome: document.querySelector("#currentOutcome"),
  proofRouteType: document.querySelector("#proofRouteType"),
  proofKeyStatus: document.querySelector("#proofKeyStatus"),
  actionResult: document.querySelector("#actionResult"),
  securityAction: document.querySelector("#securityAction"),
  securityReason: document.querySelector("#securityReason"),
  securityRoute: document.querySelector("#securityRoute"),
  resultCard: document.querySelector("#resultCard"),
  resultContent: document.querySelector("#resultContent"),
  allowedCount: document.querySelector("#allowedCount"),
  deniedCount: document.querySelector("#deniedCount"),
  eventLog: document.querySelector("#eventLog"),
};

function escapeHtml(value) {
  return value
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

function getKeyStatus() {
  if (state.selectedRoute === "public-help-hours") {
    return "Not needed";
  }
  if (!state.apiKey.trim()) {
    return "Missing";
  }
  if (state.apiKey === DEMO_KEYS.valid) {
    return "Valid";
  }
  return "Invalid";
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

function getViewModel() {
  const route = ROUTES[state.selectedRoute];

  const idleModel = {
    outcomeBadgeText: "Waiting",
    outcomeBadgeClass: "idle",
    outcomeSummary: "No request has been sent yet.",
    currentOutcome: "No action yet",
    proofRouteType: route.type,
    proofKeyStatus: route.type === "Public" ? "Not needed" : getKeyStatus(),
    actionResult: "Waiting for request",
    securityAction: "No request yet",
    securityReason: "Choose a route and send a request.",
    securityRoute: route.label,
    resultClass: "neutral",
    resultLines: ["Waiting for a demo request."],
    keyCheckCard: route.type === "Public" ? "No key required for this route" : "Waiting for staff key check",
    keyCheckCopy: route.type === "Public"
      ? "Public information stays open because it does not trigger a staff-only action."
      : "This route changes something important, so the system will check for a valid staff key first.",
    decisionCard: "Waiting for request",
    decisionCopy: "Choose a route and send a request to see what happens.",
  };

  const modeModels = {
    "public-success": {
      outcomeBadgeText: "Allowed",
      outcomeBadgeClass: "allowed",
      outcomeSummary: "Public information was returned because this route is open to everyone.",
      currentOutcome: "Allowed",
      proofRouteType: "Public",
      proofKeyStatus: "Not needed",
      actionResult: "Help desk hours shown",
      securityAction: "Allowed",
      securityReason: "Public route accessed successfully",
      securityRoute: route.label,
      resultClass: "allowed",
      resultLines: [
        "Help Desk Hours: 9:00 AM - 5:00 PM",
        "Visitor Support Counter: Ground Floor",
      ],
      keyCheckCard: "No key required for this route",
      keyCheckCopy: "Public information can stay open because it does not trigger a staff-only action.",
      decisionCard: "Public information returned",
      decisionCopy: "The system allowed this request because it is public information for everyone.",
    },
    "protected-missing-key": {
      outcomeBadgeText: "Denied",
      outcomeBadgeClass: "denied",
      outcomeSummary: "The staff-only action was blocked because no access key was provided.",
      currentOutcome: "Access denied",
      proofRouteType: "Protected",
      proofKeyStatus: "Missing",
      actionResult: "Maintenance panel stayed locked",
      securityAction: "Denied",
      securityReason: "No API key provided",
      securityRoute: route.label,
      resultClass: "denied",
      resultLines: [
        "Maintenance Panel Status: Locked",
        "Reason: No access key provided. Staff-only action blocked.",
      ],
      keyCheckCard: "No access key provided",
      keyCheckCopy: "A public visitor can view public info, but cannot run this protected action without a valid key.",
      decisionCard: "Request denied before staff action can run",
      decisionCopy: "The door stays closed when no digital access card is shown.",
    },
    "protected-invalid-key": {
      outcomeBadgeText: "Denied",
      outcomeBadgeClass: "denied",
      outcomeSummary: "A key was provided, but it did not match an authorized staff key.",
      currentOutcome: "Access denied",
      proofRouteType: "Protected",
      proofKeyStatus: "Invalid",
      actionResult: "Maintenance panel stayed locked",
      securityAction: "Denied",
      securityReason: "Invalid API key",
      securityRoute: route.label,
      resultClass: "denied",
      resultLines: [
        "Maintenance Panel Status: Locked",
        "Reason: The key was provided, but it is not authorized for this action.",
      ],
      keyCheckCard: "Key provided, but it is not authorized",
      keyCheckCopy: "The system is not just checking whether the field is filled. It checks whether the key is valid.",
      decisionCard: "Request denied after key check failed",
      decisionCopy: "Not every key-shaped value opens the staff-only door.",
    },
    "protected-valid-key": {
      outcomeBadgeText: "Allowed",
      outcomeBadgeClass: "allowed",
      outcomeSummary: "The staff-only action was allowed because a valid access key was confirmed.",
      currentOutcome: "Allowed",
      proofRouteType: "Protected",
      proofKeyStatus: "Valid",
      actionResult: "Maintenance panel opened",
      securityAction: "Allowed",
      securityReason: "Valid API key confirmed",
      securityRoute: route.label,
      resultClass: "allowed",
      resultLines: [
        "Maintenance Panel Status: Open",
        "Authorized Staff Session: Granted",
      ],
      keyCheckCard: "Valid staff access key confirmed",
      keyCheckCopy: "The key works like a digital access card that proves the request is allowed to do this staff-only action.",
      decisionCard: "Protected action allowed",
      decisionCopy: "Sensitive actions should only work after verified access is confirmed.",
    },
  };

  return modeModels[state.mode] || idleModel;
}

function render() {
  const route = ROUTES[state.selectedRoute];
  const view = getViewModel();

  elements.routeTypeBadge.textContent = `${route.type} Route`;
  elements.routeTypeBadge.className = `route-type-badge ${route.badgeClass}`;
  elements.selectedRouteCard.textContent = route.label;
  elements.routeStory.textContent = route.story;
  elements.keyHint.textContent = route.keyHint;
  elements.keyHint.className = `field-hint ${route.badgeClass === "public" ? "public-hint" : "protected-hint"}`;
  elements.proofRouteType.textContent = view.proofRouteType;
  elements.keyCheckCard.textContent = view.keyCheckCard;
  elements.keyCheckCopy.textContent = view.keyCheckCopy;
  elements.decisionCard.textContent = view.decisionCard;
  elements.decisionCopy.textContent = view.decisionCopy;
  elements.outcomeBadge.textContent = view.outcomeBadgeText;
  elements.outcomeBadge.className = `outcome-badge ${view.outcomeBadgeClass}`;
  elements.outcomeSummary.textContent = view.outcomeSummary;
  elements.currentOutcome.textContent = view.currentOutcome;
  elements.proofKeyStatus.textContent = view.proofKeyStatus;
  elements.actionResult.textContent = view.actionResult;
  elements.securityAction.textContent = view.securityAction;
  elements.securityReason.textContent = view.securityReason;
  elements.securityRoute.textContent = view.securityRoute;
  elements.resultCard.className = `result-card ${view.resultClass}`;
  elements.allowedCount.textContent = state.allowedCount;
  elements.deniedCount.textContent = state.deniedCount;
  setResultLines(view.resultLines);
  renderEventLog();
}

function handleRequest() {
  if (state.selectedRoute === "public-help-hours") {
    state.mode = "public-success";
    state.allowedCount += 1;
    addLogEntry({
      title: "Public route allowed",
      message: "No key required for GET /public/help-hours",
      statusClass: "allowed",
    });
    render();
    return;
  }

  if (!state.apiKey.trim()) {
    state.mode = "protected-missing-key";
    state.deniedCount += 1;
    addLogEntry({
      title: "Protected route denied",
      message: "Missing key blocked POST /staff/open-maintenance-panel",
      statusClass: "denied",
    });
    render();
    return;
  }

  if (state.apiKey === DEMO_KEYS.valid) {
    state.mode = "protected-valid-key";
    state.allowedCount += 1;
    addLogEntry({
      title: "Protected route allowed",
      message: "Valid staff key confirmed for POST /staff/open-maintenance-panel",
      statusClass: "allowed",
    });
    render();
    return;
  }

  state.mode = "protected-invalid-key";
  state.deniedCount += 1;
  addLogEntry({
    title: "Protected route denied",
    message: "Invalid key blocked POST /staff/open-maintenance-panel",
    statusClass: "denied",
  });
  render();
}

function resetDemo() {
  state.selectedRoute = "public-help-hours";
  state.apiKey = "";
  state.mode = "idle";
  state.allowedCount = 0;
  state.deniedCount = 0;
  state.eventLog = [];

  elements.routeSelect.value = state.selectedRoute;
  elements.apiKeyInput.value = "";
  render();
}

elements.routeSelect.addEventListener("change", (event) => {
  state.selectedRoute = event.target.value;
  state.mode = "idle";
  render();
});

elements.apiKeyInput.addEventListener("input", (event) => {
  state.apiKey = event.target.value;
  if (state.mode !== "idle") {
    state.mode = "idle";
  }
  render();
});

elements.noKeyButton.addEventListener("click", () => {
  state.apiKey = "";
  elements.apiKeyInput.value = "";
  state.mode = "idle";
  render();
});

elements.validKeyButton.addEventListener("click", () => {
  state.apiKey = DEMO_KEYS.valid;
  elements.apiKeyInput.value = DEMO_KEYS.valid;
  state.mode = "idle";
  render();
});

elements.wrongKeyButton.addEventListener("click", () => {
  state.apiKey = DEMO_KEYS.wrong;
  elements.apiKeyInput.value = DEMO_KEYS.wrong;
  state.mode = "idle";
  render();
});

elements.sendRequestButton.addEventListener("click", handleRequest);
elements.resetButton.addEventListener("click", resetDemo);

render();

const GLOBAL_ENV_API = window.SimulationGlobalEnv;
const DEFAULT_GATEWAY_BASE_URL = "http://localhost:30080";
const DEFAULT_SERVICE_NAME = "expo-unified-target";

function getConfiguredServiceName() {
  if (GLOBAL_ENV_API && typeof GLOBAL_ENV_API.getConfig === "function") {
    const config = GLOBAL_ENV_API.getConfig();
    if (config && typeof config.serviceName === "string" && config.serviceName.trim()) {
      return config.serviceName.trim();
    }
  }
  return DEFAULT_SERVICE_NAME;
}

function buildDefaultGatewayUrl(routePath) {
  const serviceName = getConfiguredServiceName();
  if (GLOBAL_ENV_API && typeof GLOBAL_ENV_API.buildGatewayUrl === "function") {
    return GLOBAL_ENV_API.buildGatewayUrl(DEFAULT_GATEWAY_BASE_URL, serviceName, routePath);
  }

  const normalizedRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${DEFAULT_GATEWAY_BASE_URL}/${serviceName}${normalizedRoute}`;
}

const DEMO_KEYS = {
  valid: "STAFF-ACCESS-DEMO-2026",
  wrong: "STAFF-KEY-DEMO-WRONG",
};

const elements = {
  urlInput: document.getElementById("urlInput"),
  methodSelect: document.getElementById("methodSelect"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  noKeyButton: document.getElementById("noKeyButton"),
  validKeyButton: document.getElementById("validKeyButton"),
  wrongKeyButton: document.getElementById("wrongKeyButton"),
  sendRequestButton: document.getElementById("sendRequestButton"),
  statusIndicator: document.getElementById("statusIndicator"),
  form: document.getElementById("apiForm"),
};

function setStatus(status, message) {
  elements.statusIndicator.className = `status-indicator ${status}`;
  elements.statusIndicator.textContent = message;
}

elements.urlInput.value = buildDefaultGatewayUrl("/staff/open-maintenance-panel");

elements.noKeyButton.addEventListener("click", () => {
  elements.apiKeyInput.value = "";
});

elements.validKeyButton.addEventListener("click", () => {
  elements.apiKeyInput.value = DEMO_KEYS.valid;
});

elements.wrongKeyButton.addEventListener("click", () => {
  elements.apiKeyInput.value = DEMO_KEYS.wrong;
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = elements.urlInput.value.trim();
  const method = elements.methodSelect.value;
  const apiKey = elements.apiKeyInput.value.trim();

  if (!url) {
    setStatus("error", "Please provide a target Gateway URL.");
    return;
  }

  elements.sendRequestButton.disabled = true;
  elements.sendRequestButton.textContent = "Sending...";
  setStatus("idle", "Sending request to gateway...");

  const headers = {};
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: method,
      headers: headers,
    });

    try {
      const payload = await response.json();

      if (response.status === 401) {
        setStatus("error", `Rejected: Unauthorized access (HTTP 401). Gateway blocked request.`);
      } else if (response.ok) {
        setStatus("success", `Accepted: Request succeeded (HTTP ${response.status}).`);
      } else {
        setStatus("idle", `Request returned HTTP ${response.status}.`);
      }
    } catch (e) {
      if (response.status === 401) {
        setStatus("error", `Rejected: Unauthorized access (HTTP 401). Gateway blocked request.`);
      } else if (response.ok) {
        setStatus("success", `Accepted: Gateway forwarded request (HTTP ${response.status}).`);
      } else {
        setStatus("error", `Rejected: Gateway returned HTTP ${response.status}.`);
      }
    }
  } catch (error) {
    setStatus("error", `Error: Could not reach Gateway. ${error.message}`);
  } finally {
    elements.sendRequestButton.disabled = false;
    elements.sendRequestButton.textContent = "Send Request";
  }
});

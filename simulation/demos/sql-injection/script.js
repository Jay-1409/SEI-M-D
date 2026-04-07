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

const NORMAL_USER = {
  username: "admin",
  password: "admin123",
};

const ATTACK_USER = {
  username: "admin",
  password: "' OR '1'='1",
};

const elements = {
  urlInput: document.getElementById("urlInput"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  fillNormalButton: document.getElementById("fillNormalButton"),
  fillAttackButton: document.getElementById("fillAttackButton"),
  loginButton: document.getElementById("loginButton"),
  statusIndicator: document.getElementById("statusIndicator"),
};

function setStatus(status, message) {
  elements.statusIndicator.className = `status-indicator ${status}`;
  elements.statusIndicator.textContent = message;
}

elements.urlInput.value = buildDefaultGatewayUrl("/login");

elements.fillNormalButton.addEventListener("click", () => {
  elements.usernameInput.value = NORMAL_USER.username;
  elements.passwordInput.value = NORMAL_USER.password;
});

elements.fillAttackButton.addEventListener("click", () => {
  elements.usernameInput.value = ATTACK_USER.username;
  elements.passwordInput.value = ATTACK_USER.password;
});

elements.loginButton.addEventListener("click", async () => {
  const url = elements.urlInput.value.trim();
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value.trim();

  if (!url) {
    setStatus("error", "Please provide a target Gateway URL.");
    return;
  }

  elements.loginButton.disabled = true;
  elements.loginButton.textContent = "Sending...";
  setStatus("idle", "Sending request to gateway...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    try {
      const payload = await response.json();

      if (response.status === 403 && payload?.attack_type === "sqli") {
        setStatus("error", "Blocked: SQL Injection attack detected by Gateway WAF.");
      } else if (response.ok && payload?.auth_mode) {
        setStatus("success", "Accepted: Service granted access.");
      } else if (response.status === 401 || payload?.result === "denied") {
        setStatus("error", "Rejected: Service denied access (Invalid Credentials).");
      } else {
        setStatus("idle", `Request returned HTTP ${response.status}. Expected demo payload not found.`);
      }
    } catch (e) {
      if (response.ok) {
        setStatus("success", `Accepted: Gateway forwarded request (HTTP ${response.status}).`);
      } else {
        setStatus("error", `Rejected: Gateway returned HTTP ${response.status}.`);
      }
    }
  } catch (error) {
    setStatus("error", `Error: Could not reach Gateway. ${error.message}`);
  } finally {
    elements.loginButton.disabled = false;
    elements.loginButton.textContent = "Send Login Request";
  }
});

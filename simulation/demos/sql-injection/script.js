const NORMAL_USER = {
  username: "admin",
  password: "admin123"
};

const ATTACK_USER = {
  username: "admin",
  password: "' OR '1'='1"
};

const state = {
  protectionEnabled: false,
  mode: "idle",
  blockedCount: 0,
  requestCount: 0,
  activityLog: []
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
  activityLog: document.getElementById("activityLog"),
  requestCount: document.getElementById("requestCount")
};

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
  render();
});

elements.resetButton.addEventListener("click", () => {
  elements.usernameInput.value = "";
  elements.passwordInput.value = "";
  state.mode = "idle";
  render();
});

elements.loginButton.addEventListener("click", () => {
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value.trim();

  state.requestCount += 1;

  if (username === NORMAL_USER.username && password === NORMAL_USER.password) {
    state.mode = "normal-success";
    prependLog("allowed", "Normal Login | Allowed", "admin signed in successfully with the correct password.");
  } else if (isAttackPayload(password) && username === ATTACK_USER.username) {
    if (state.protectionEnabled) {
      state.mode = "attack-blocked";
      state.blockedCount += 1;
      prependLog("blocked", "SQL Injection | Blocked", "Suspicious payload was detected in the password field before access was granted.");
    } else {
      state.mode = "attack-success";
      prependLog("vulnerable", "SQL Injection | Allowed", "Malicious input bypassed the weak login and opened the dashboard without the real password.");
    }
  } else {
    state.mode = "invalid";
    prependLog("invalid", "Invalid Login | Denied", "The login attempt did not match the supported demo credentials.");
  }

  render();
});

function isAttackPayload(value) {
  return /^'\s*or\s*'1'\s*=\s*'1$/i.test(value);
}

function prependLog(kind, title, message) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  state.activityLog.unshift({
    kind,
    title,
    message,
    timeLabel
  });

  state.activityLog = state.activityLog.slice(0, 8);
}

function render() {
  renderProtectionState();
  renderModeState();
  renderActivityLog();
  elements.blockedCount.textContent = String(state.blockedCount);
  elements.requestCount.textContent = `${state.requestCount} request${state.requestCount === 1 ? "" : "s"}`;
}

function renderProtectionState() {
  if (state.protectionEnabled) {
    elements.protectionPill.textContent = "Protection ON";
    elements.protectionPill.className = "protection-pill protected";
    elements.toggleProtectionButton.textContent = "Turn Protection OFF";
    elements.protectionExplanation.textContent =
      "Protection is ON right now, so suspicious input is flagged and blocked before an unsafe query can change the login logic.";
  } else {
    elements.protectionPill.textContent = "Protection OFF";
    elements.protectionPill.className = "protection-pill vulnerable";
    elements.toggleProtectionButton.textContent = "Turn Protection ON";
    elements.protectionExplanation.textContent =
      "Protection is OFF right now, so the demo shows what happens when a weak login treats raw input as part of the database logic.";
  }
}

function renderModeState() {
  switch (state.mode) {
    case "normal-success":
      setBanner("success", "Login successful", "A real user got in with the correct password.");
      setProcess(
        `Username: ${escapeHtml(elements.usernameInput.value)}<br>Password: ${escapeHtml(elements.passwordInput.value)}`,
        "SELECT * FROM users WHERE username = 'admin' AND password = 'admin123'",
        "The login matches a real user account, so access is granted normally."
      );
      setProof("allowed", "Allowed", "No attack detected", "Admin Dashboard", "None", "None", "Allowed", "Clean request passed",
        "Normal login worked as expected. This shows that protection does not block legitimate users.");
      break;
    case "attack-success":
      setBanner("warning", "Login successful", "Access granted by manipulated input. This login succeeded without the correct password.");
      setProcess(
        `Username: ${escapeHtml(elements.usernameInput.value)}<br>Password: <span class="highlight-bad">${escapeHtml(elements.passwordInput.value)}</span>`,
        `SELECT * FROM users WHERE username = 'admin' AND password = '<span class="highlight-bad">' OR '1'='1</span>'`,
        "Because '1'='1' is always true, the weak app treats the login check like a valid match and opens the dashboard."
      );
      setProof("vulnerable", "Unauthorized access allowed", "Attack succeeded", "Admin Dashboard (unauthorized)", "SQL Injection", "Password", "Allowed", "No blocking protection",
        "This is the proof of failure: the attacker reached the dashboard even though no real password was used.");
      break;
    case "attack-blocked":
      setBanner("danger", "Login blocked", "Suspicious input was stopped before it could change the login logic.");
      setProcess(
        `Username: ${escapeHtml(elements.usernameInput.value)}<br>Password: <span class="highlight-bad">${escapeHtml(elements.passwordInput.value)}</span>`,
        "Suspicious pattern detected in password input.<br>Request blocked before any unsafe query can run.",
        "The protected flow recognizes the payload as a SQL injection attempt and denies access before the trick can reach the database logic."
      );
      setProof("blocked", "Attack blocked", "SQL injection attempt detected", "No access granted", "SQL Injection", "Password", "Blocked", "Suspicious login payload",
        "This is the proof of protection: the same malicious input is blocked and no dashboard access is granted.");
      break;
    case "invalid":
      setBanner("idle", "Invalid username or password", "Only the supported demo inputs create the normal or malicious demo paths.");
      setProcess(
        `Username: ${escapeHtml(elements.usernameInput.value || "(empty)")}<br>Password: ${escapeHtml(elements.passwordInput.value || "(empty)")}`,
        "The input does not match the supported demo cases.",
        "The simulation denies the login because the credentials are not the approved normal pair or the approved attack payload."
      );
      setProof("neutral", "Invalid login attempt", "No successful attack", "No access granted", "None", "None", "Denied", "Unsupported demo input",
        "This is a safe fallback path for any manual input outside the supported demo cases.");
      break;
    case "idle":
    default:
      setBanner("idle", "Waiting for login attempt", "No action yet. Choose a safe login or the malicious demo input.");
      setProcess(
        "No request yet.",
        "Waiting for a login attempt.",
        "The app has not processed anything yet."
      );
      setProof("neutral", "No action yet", "None", "No access yet", "None", "None", "Waiting", "No request yet",
        "The proof panel will show either unauthorized access in vulnerable mode or a blocked security event in protected mode.");
      break;
  }
}

function setBanner(kind, title, description) {
  elements.resultBanner.className = `result-banner ${kind}`;
  elements.resultBanner.innerHTML = `<strong>${title}</strong><p>${description}</p>`;
}

function setProcess(inputHtml, queryHtml, decisionText) {
  elements.inputSummary.innerHTML = inputHtml;
  elements.querySummary.innerHTML = queryHtml;
  elements.decisionSummary.textContent = decisionText;
}

function setProof(badgeClass, outcome, attackStatusText, accessGrantedText, threat, field, action, reason, explanation) {
  elements.proofBadge.className = `proof-badge ${badgeClass}`;
  elements.proofBadge.textContent = outcome;
  elements.currentOutcome.textContent = outcome;
  elements.attackStatus.textContent = attackStatusText;
  elements.accessGranted.textContent = accessGrantedText;
  elements.eventThreat.textContent = threat;
  elements.eventField.textContent = field;
  elements.eventAction.textContent = action;
  elements.eventReason.textContent = reason;
  elements.proofExplanation.textContent = explanation;
}

function renderActivityLog() {
  if (state.activityLog.length === 0) {
    elements.activityLog.innerHTML = '<p class="empty-log">No activity yet.</p>';
    return;
  }

  elements.activityLog.innerHTML = state.activityLog
    .map((entry) => {
      return `
        <article class="log-entry ${entry.kind}">
          <strong>${entry.title}</strong>
          <span>${entry.message}</span>
          <span>${entry.timeLabel}</span>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

render();

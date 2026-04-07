(function () {
  const LIVE_NORMAL_REQUESTS = 1;
  const GLOBAL_ENV_API = window.SimulationGlobalEnv;
  const DEFAULT_SERVICE_NAME = "expo-unified-target";
  const DEFAULT_GATEWAY_BASE_URL = "http://localhost:30080";

  const SPEED_MAP = {
    slow: 420,
    medium: 220,
    fast: 110,
  };

  function getConfiguredServiceName() {
    if (GLOBAL_ENV_API && typeof GLOBAL_ENV_API.getConfig === "function") {
      const config = GLOBAL_ENV_API.getConfig();
      if (config && typeof config.serviceName === "string" && config.serviceName.trim()) {
        return config.serviceName.trim();
      }
    }
    return DEFAULT_SERVICE_NAME;
  }

  function getDefaultTargetUrl() {
    const serviceName = getConfiguredServiceName();
    if (GLOBAL_ENV_API && typeof GLOBAL_ENV_API.buildGatewayUrl === "function") {
      return GLOBAL_ENV_API.buildGatewayUrl(DEFAULT_GATEWAY_BASE_URL, serviceName, "/tickets");
    }
    return `${DEFAULT_GATEWAY_BASE_URL}/${serviceName}/tickets`;
  }

  const state = {
    targetUrl: getDefaultTargetUrl(),
    totalRequests: 0,
    normalAllowed: 0,
    spamAllowed: 0,
    spamBlocked: 0,
    normalDelaySamples: [],
    pressure: "low",
    activeRequests: 0,
    floodRunning: false,
    requestId: 1,
    logEntries: [],
    timers: new Set(),
  };

  const elements = {
    targetUrlInput: document.getElementById("targetUrlInput"),
    speedSelect: document.getElementById("speedSelect"),
    burstSelect: document.getElementById("burstSelect"),
    normalButton: document.getElementById("normalButton"),
    spamButton: document.getElementById("spamButton"),
    resetButton: document.getElementById("resetButton"),
    gateBadge: document.getElementById("gateBadge"),
    modePill: document.getElementById("modePill"),
    pressureLabel: document.getElementById("pressureLabel"),
    pressureFill: document.getElementById("pressureFill"),
    serverBox: document.getElementById("serverBox"),
    serverHint: document.getElementById("serverHint"),
    totalRequests: document.getElementById("totalRequests"),
    normalAllowed: document.getElementById("normalAllowed"),
    spamAllowed: document.getElementById("spamAllowed"),
    spamBlocked: document.getElementById("spamBlocked"),
    eventLogBody: document.getElementById("eventLogBody"),
    logHint: document.getElementById("logHint"),
    customerLane: document.getElementById("customerLane"),
    botLane: document.getElementById("botLane"),
    summaryCard: document.getElementById("summaryCard"),
    summaryHeadline: document.getElementById("summaryHeadline"),
    summaryText: document.getElementById("summaryText"),
  };

  function registerTimer(callback, delay) {
    const timer = window.setTimeout(() => {
      state.timers.delete(timer);
      callback();
    }, delay);
    state.timers.add(timer);
    return timer;
  }

  function clearAllTimers() {
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers.clear();
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function clockTime() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  function nextRequestId(actor) {
    const prefix = actor === "customer" ? "book-seat" : "bot-seat";
    const id = `${prefix}-${String(state.requestId).padStart(3, "0")}`;
    state.requestId += 1;
    return id;
  }

  function updatePressure() {
    let pressure = "low";
    let width = 18;

    if (state.activeRequests >= 10) {
      pressure = "high";
      width = 95;
    } else if (state.activeRequests >= 5) {
      pressure = "medium";
      width = 62;
    }

    state.pressure = pressure;
    elements.pressureLabel.textContent = pressure.toUpperCase();
    elements.pressureFill.className = `pressure-fill ${pressure}`;
    elements.pressureFill.style.width = `${width}%`;
  }

  function updateCounters() {
    elements.totalRequests.textContent = String(state.totalRequests);
    elements.normalAllowed.textContent = String(state.normalAllowed);
    elements.spamAllowed.textContent = String(state.spamAllowed);
    elements.spamBlocked.textContent = String(state.spamBlocked);
  }

  function setActionLocks(disabled) {
    elements.targetUrlInput.disabled = disabled;
    elements.speedSelect.disabled = disabled;
    elements.burstSelect.disabled = disabled;
    elements.normalButton.disabled = disabled;
    elements.spamButton.disabled = disabled;
  }

  function updateLogHint(text) {
    elements.logHint.textContent = text;
  }

  function addLogEntry(entry) {
    state.logEntries.unshift(entry);
    state.logEntries = state.logEntries.slice(0, 14);

    elements.eventLogBody.innerHTML = state.logEntries
      .map((row) => {
        const rowClass =
          row.result === "BLOCKED"
            ? "blocked-row"
            : row.result === "WAITING"
              ? "waiting-row"
              : "allowed-row";

        return `
          <tr class="${rowClass}">
            <td>${row.time}</td>
            <td>${row.actor}</td>
            <td>${row.requestId}</td>
            <td>${row.result}</td>
            <td>${row.reason}</td>
          </tr>
        `;
      })
      .join("");
  }

  function clearLanes() {
    [elements.customerLane, elements.botLane].forEach((lane) => {
      lane.querySelectorAll(".request-chip, .response-chip").forEach((node) => node.remove());
    });
  }

  function createChip(laneElement, kind, text, top, variant) {
    const chip = document.createElement("div");
    chip.className = `${kind} ${variant}`;
    chip.textContent = text;
    chip.style.top = `${top}px`;
    laneElement.appendChild(chip);
    registerTimer(() => chip.remove(), kind === "request-chip" ? 1500 : 1300);
  }

  function responseLabelFor(status) {
    if (status === "blocked") {
      return "Blocked 429";
    }
    if (status === "waiting") {
      return "Waiting";
    }
    return "Booked";
  }

  function addVisualRequest(actor, status, requestId, reasonOverride) {
    const lane = actor === "customer" ? elements.customerLane : elements.botLane;
    const offset = (state.requestId * 26) % 210;
    const top = 56 + offset;

    createChip(
      lane,
      "request-chip",
      actor === "customer" ? "Book Seat" : "Rapid Request",
      top,
      status === "blocked" ? "blocked" : status === "waiting" ? "waiting" : "pending"
    );

    registerTimer(() => {
      createChip(
        lane,
        "response-chip",
        responseLabelFor(status),
        top,
        status === "blocked" ? "blocked" : status === "waiting" ? "waiting" : "allowed"
      );
    }, status === "blocked" ? 650 : 860);

    addLogEntry({
      time: clockTime(),
      actor: actor === "customer" ? "Customer" : "Bot",
      requestId,
      result: status === "blocked" ? "BLOCKED" : status === "waiting" ? "WAITING" : "ALLOWED",
      reason:
        reasonOverride ||
        (status === "blocked"
          ? "HTTP 429 Too Many Requests"
          : status === "waiting"
            ? "Target missing or unexpected response"
            : "Gateway accepted request"),
    });
  }

  function flashServer(status) {
    const cssClass =
      status === "blocked" ? "blocked-flash" : status === "waiting" ? "waiting-flash" : "allowed-flash";
    elements.serverBox.classList.remove("allowed-flash", "blocked-flash", "waiting-flash");
    void elements.serverBox.offsetWidth;
    elements.serverBox.classList.add(cssClass);
    registerTimer(() => {
      elements.serverBox.classList.remove(cssClass);
    }, 500);
  }

  function getQueueDelayMs(actor) {
    if (actor !== "customer" || !state.floodRunning) {
      return 0;
    }

    const baseDelay = state.spamBlocked > 0 ? 280 : 1050;
    const loadPenalty = Math.min(850, state.activeRequests * 35);
    return baseDelay + loadPenalty;
  }

  function trackResolvedRequest(status, actor, requestId, reason) {
    if (status === "allowed") {
      if (actor === "customer") {
        state.normalAllowed += 1;
      } else {
        state.spamAllowed += 1;
      }
    } else if (status === "blocked") {
      state.spamBlocked += 1;
    }

    addVisualRequest(actor, status, requestId, reason);
    updateCounters();
    flashServer(status);

    registerTimer(() => {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
      updatePressure();
    }, status === "blocked" ? 650 : 1200);
  }

  async function sendLiveRequest(actor) {
    const requestId = nextRequestId(actor);
    const targetUrl = elements.targetUrlInput.value.trim();
    const requestStartedAt = Date.now();
    state.targetUrl = targetUrl;

    state.totalRequests += 1;
    state.activeRequests += 1;
    updatePressure();

    if (!targetUrl) {
      trackResolvedRequest("waiting", actor, requestId, "Target URL is required");
      updateLogHint("Set a target URL first");
      return;
    }

    const queueDelayMs = getQueueDelayMs(actor);
    if (queueDelayMs > 0) {
      addVisualRequest("customer", "waiting", requestId, `Normal user waiting in queue (${queueDelayMs} ms)`);
      updateLogHint("Normal user is waiting due to flood load");
      elements.serverHint.textContent = "Normal users are waiting longer while flood traffic is high.";
      await new Promise((resolve) => registerTimer(resolve, queueDelayMs));
    }

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          "X-Expo-Demo-Actor": actor === "customer" ? "normal-visitor" : "bot-flood",
          "X-Expo-Request-Id": requestId,
        },
      });
      const elapsedMs = Date.now() - requestStartedAt;

      if (response.status === 429) {
        trackResolvedRequest("blocked", actor, requestId, `HTTP 429 in ${elapsedMs} ms`);
        updateLogHint("Rate limit is blocking flood traffic");
      } else if (response.ok) {
        const reason =
          actor === "customer" && queueDelayMs > 0
            ? `HTTP ${response.status} in ${elapsedMs} ms (delayed by flood)`
            : `HTTP ${response.status} in ${elapsedMs} ms`;
        trackResolvedRequest("allowed", actor, requestId, reason);

        if (actor === "customer" && queueDelayMs > 0) {
          state.normalDelaySamples.push(elapsedMs);
          updateLogHint(`Normal user delayed: ${elapsedMs} ms response time`);
          elements.serverHint.textContent = `Normal user response took ${elapsedMs} ms during flood load.`;
        } else {
          updateLogHint(actor === "customer" ? "Normal request accepted" : "Flood request accepted");
        }
      } else {
        trackResolvedRequest("waiting", actor, requestId, `HTTP ${response.status} in ${elapsedMs} ms`);
        updateLogHint("Unexpected response from target URL");
      }
    } catch (error) {
      const elapsedMs = Date.now() - requestStartedAt;
      trackResolvedRequest("waiting", actor, requestId, `Connection error after ${elapsedMs} ms: ${error.message}`);
      updateLogHint("Target URL is unreachable");
    }
  }

  function finishFlood() {
    state.floodRunning = false;
    setActionLocks(false);
    elements.summaryCard.classList.remove("hidden");
    const avgNormalDelayMs = state.normalDelaySamples.length
      ? Math.round(state.normalDelaySamples.reduce((sum, ms) => sum + ms, 0) / state.normalDelaySamples.length)
      : 0;

    if (state.spamBlocked > 0) {
      elements.summaryHeadline.textContent = "Rate limiting is active";
      elements.summaryText.textContent = avgNormalDelayMs > 0
        ? `${state.spamBlocked} flood requests were blocked with HTTP 429. Normal users still waited about ${avgNormalDelayMs} ms during peak load.`
        : `${state.spamBlocked} flood requests were blocked with HTTP 429 while normal traffic remained visible.`;
    } else {
      elements.summaryHeadline.textContent = "No 429 seen in this run";
      elements.summaryText.textContent = avgNormalDelayMs > 0
        ? `Flood traffic was accepted. Normal users waited about ${avgNormalDelayMs} ms and did not get fast responses.`
        : "Flood traffic was accepted. Check target URL and rate-limit policy, then run again.";
    }

    if (avgNormalDelayMs > 0) {
      elements.serverHint.textContent = `Normal users waited about ${avgNormalDelayMs} ms during the flood.`;
    }
  }

  function startSpamFlood() {
    if (state.floodRunning) {
      return;
    }

    state.floodRunning = true;
    elements.summaryCard.classList.add("hidden");
    setActionLocks(true);
    updateLogHint("Flood test in progress");

    const speed = SPEED_MAP[elements.speedSelect.value] || SPEED_MAP.medium;
    const burst = Number(elements.burstSelect.value);

    for (let index = 0; index < burst; index += 1) {
      registerTimer(() => {
        void sendLiveRequest("bot");

        if (index === Math.floor(burst / 2)) {
          registerTimer(() => void sendLiveRequest("customer"), 140);
        }

        if (index === burst - 1) {
          registerTimer(finishFlood, 1900);
        }
      }, index * speed);
    }
  }

  function sendNormalRequest() {
    if (state.floodRunning) {
      return;
    }

    elements.summaryCard.classList.add("hidden");
    updateLogHint("Sending normal request");

    for (let index = 0; index < LIVE_NORMAL_REQUESTS; index += 1) {
      registerTimer(() => void sendLiveRequest("customer"), index * 380);
    }
  }

  function resetDemo() {
    clearAllTimers();
    state.totalRequests = 0;
    state.normalAllowed = 0;
    state.spamAllowed = 0;
    state.spamBlocked = 0;
    state.normalDelaySamples = [];
    state.pressure = "low";
    state.activeRequests = 0;
    state.floodRunning = false;
    state.requestId = 1;
    state.logEntries = [];

    if (!elements.targetUrlInput.value.trim()) {
      elements.targetUrlInput.value = getDefaultTargetUrl();
    }
    state.targetUrl = elements.targetUrlInput.value.trim();

    clearLanes();
    elements.eventLogBody.innerHTML = "";
    elements.summaryCard.classList.add("hidden");
    elements.gateBadge.textContent = "Live Gateway Check";
    elements.modePill.textContent = "Live URL";
    elements.serverHint.textContent = "Requests are sent to the target URL above.";

    updateCounters();
    updatePressure();
    updateLogHint("Waiting for traffic");
    setActionLocks(false);
  }

  elements.targetUrlInput.value = state.targetUrl;

  elements.targetUrlInput.addEventListener("input", (event) => {
    state.targetUrl = event.target.value.trim();
  });
  elements.normalButton.addEventListener("click", sendNormalRequest);
  elements.spamButton.addEventListener("click", startSpamFlood);
  elements.resetButton.addEventListener("click", resetDemo);

  resetDemo();
})();

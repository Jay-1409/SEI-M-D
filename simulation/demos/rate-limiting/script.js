(function () {
  const RATE_LIMIT_THRESHOLD = 5;
  const RATE_LIMIT_WINDOW_MS = 3000;
  const LIVE_NORMAL_REQUESTS = 3;

  const SPEED_MAP = {
    slow: 420,
    medium: 220,
    fast: 110,
  };

  const LIVE_DEFAULTS = {
    gatewayBaseUrl: "http://localhost:30080",
    targetRoute: "/expo-rate-limit-demo/tickets",
    platformApiBase: "http://localhost:30000/api",
  };

  const state = {
    mode: "on",
    connectionMode: "local",
    totalRequests: 0,
    normalAllowed: 0,
    spamAllowed: 0,
    spamBlocked: 0,
    pressure: "low",
    activeRequests: 0,
    floodRunning: false,
    replayRunning: false,
    requestId: 1,
    botWindow: [],
    logEntries: [],
    timers: new Set(),
    liveConfig: { ...LIVE_DEFAULTS },
    liveProof: {
      serviceName: "",
      targetLabel: "Not configured",
      configSummary: "Unknown",
      lastResult: "No live request yet",
      source: "Gateway responses only",
    },
  };

  const elements = {
    modeHeadline: document.getElementById("modeHeadline"),
    modeToggle: document.getElementById("modeToggle"),
    speedSelect: document.getElementById("speedSelect"),
    burstSelect: document.getElementById("burstSelect"),
    normalButton: document.getElementById("normalButton"),
    spamButton: document.getElementById("spamButton"),
    replayButton: document.getElementById("replayButton"),
    resetButton: document.getElementById("resetButton"),
    gateBadge: document.getElementById("gateBadge"),
    modePill: document.getElementById("modePill"),
    pressureLabel: document.getElementById("pressureLabel"),
    pressureFill: document.getElementById("pressureFill"),
    serverBox: document.getElementById("serverBox"),
    serverHint: document.getElementById("serverHint"),
    narrationText: document.getElementById("narrationText"),
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
    connectionModeBadge: document.getElementById("connectionModeBadge"),
    connectionModeSelect: document.getElementById("connectionModeSelect"),
    liveConfigFields: document.getElementById("liveConfigFields"),
    gatewayBaseUrlInput: document.getElementById("gatewayBaseUrlInput"),
    targetRouteInput: document.getElementById("targetRouteInput"),
    platformApiBaseInput: document.getElementById("platformApiBaseInput"),
    liveDefaultsButton: document.getElementById("liveDefaultsButton"),
    liveProofCard: document.getElementById("liveProofCard"),
    liveProofService: document.getElementById("liveProofService"),
    liveProofTarget: document.getElementById("liveProofTarget"),
    liveProofConfig: document.getElementById("liveProofConfig"),
    liveProofLastResult: document.getElementById("liveProofLastResult"),
    liveProofSource: document.getElementById("liveProofSource"),
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

  function inferServiceName(routePath) {
    const normalized = normalizeRoutePath(routePath);
    if (!normalized) {
      return "";
    }
    const parts = normalized.split("/").filter(Boolean);
    return parts[0] || "";
  }

  function buildLiveTargetUrl() {
    const baseUrl = normalizeBaseUrl(state.liveConfig.gatewayBaseUrl);
    const routePath = normalizeRoutePath(state.liveConfig.targetRoute);
    if (!baseUrl || !routePath) {
      return "";
    }
    return `${baseUrl}${routePath}`;
  }


  function updateModeUI() {
    const liveMode = state.connectionMode === "live";
    const protectedMode = state.mode === "on";

    if (liveMode) {
      elements.modeHeadline.textContent = "Platform Controlled";
      elements.modeToggle.textContent = "Use platform UI";
      elements.modeToggle.className = "toggle-button platform";
      elements.gateBadge.textContent = "Live Gateway Route";
      elements.gateBadge.className = "gate-badge live";
      elements.modePill.textContent = "Live";
      elements.modePill.className = "mode-pill live";
      elements.serverHint.textContent =
        "Real responses now come from the configured gateway route and its current rate-limit policy.";
      return;
    }

    elements.modeHeadline.textContent = protectedMode ? "Rate Limit ON" : "Rate Limit OFF";
    elements.modeToggle.textContent = protectedMode ? "Switch to OFF" : "Switch to ON";
    elements.modeToggle.className = `toggle-button ${protectedMode ? "protected" : "unprotected"}`;
    elements.gateBadge.textContent = protectedMode ? "Rate Limiter Active" : "No Limit";
    elements.gateBadge.className = `gate-badge ${protectedMode ? "protected" : "unprotected"}`;
    elements.modePill.textContent = protectedMode ? "Protected" : "Unprotected";
    elements.modePill.className = `mode-pill ${protectedMode ? "protected" : "unprotected"}`;
    elements.serverHint.textContent = protectedMode
      ? "Protected traffic stays fair and stable."
      : "Flood traffic can keep entering unchecked.";
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

  function setNarration(text) {
    if (elements.narrationText) {
      elements.narrationText.textContent = text;
    }
  }

  function setActionLocks(disabled) {
    elements.modeToggle.disabled = disabled || state.connectionMode === "live";
    elements.speedSelect.disabled = disabled;
    elements.burstSelect.disabled = disabled;
    elements.replayButton.disabled = disabled || state.connectionMode === "live";
    elements.spamButton.disabled = disabled;
    elements.connectionModeSelect.disabled = disabled;
    elements.gatewayBaseUrlInput.disabled = disabled;
    elements.targetRouteInput.disabled = disabled;
    elements.platformApiBaseInput.disabled = disabled;
    elements.liveDefaultsButton.disabled = disabled;
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
          ? "Rate limit exceeded"
          : status === "waiting"
            ? "Target missing or unexpected response"
            : actor === "customer"
              ? "Normal traffic"
              : "Accepted by gateway"),
    });
  }

  function trimBotWindow() {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    state.botWindow = state.botWindow.filter((stamp) => stamp >= cutoff);
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

  function setLiveProofLastResult(text) {
    state.liveProof.lastResult = text;
  }

  async function refreshLiveProof() {
    const apiBase = normalizeBaseUrl(state.liveConfig.platformApiBase);
    const serviceName = inferServiceName(state.liveConfig.targetRoute);
    const targetUrl = buildLiveTargetUrl();

    state.liveProof.serviceName = serviceName || "Not configured";
    state.liveProof.targetLabel = targetUrl || "Not configured";
    state.liveProof.configSummary = "Unknown";
    state.liveProof.source = "Gateway responses only";

    if (!apiBase || !serviceName) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/services/${serviceName}/ratelimit`);
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      const globalSummary = payload.enabled
        ? `ON | global ${payload.limit} requests / ${payload.window}s`
        : "OFF";
      const routeRelativePath = (() => {
        const routePath = normalizeRoutePath(state.liveConfig.targetRoute);
        const prefix = `/${serviceName}`;
        const stripped = routePath.startsWith(prefix) ? routePath.slice(prefix.length) : routePath;
        return stripped || "/";
      })();
      const routeMatch = Array.isArray(payload.routes)
        ? payload.routes.find((route) => route.path === routeRelativePath)
        : null;

      state.liveProof.configSummary = routeMatch
        ? `${globalSummary} | route ${routeMatch.method} ${routeMatch.path} => ${routeMatch.limit} / ${routeMatch.window}s`
        : globalSummary;
      state.liveProof.source = "Gateway responses + platform rate-limit config";
    } catch (error) {
      state.liveProof.source = "Gateway responses only";
    }
  }

  function updateNarrationForLocal(status, actor) {
    if (status === "blocked") {
      setNarration(
        "The gate is now rejecting repeated bot requests with 429 Too Many Requests, while genuine visitors can still get through."
      );
      updateLogHint("Blocked events are visible now");
      return;
    }

    if (status === "waiting") {
      setNarration(
        "Without rate limiting, flood traffic is crowding the line. Real visitors start feeling delay and unfairness."
      );
      updateLogHint("Queue pressure is affecting normal traffic");
      return;
    }

    if (actor === "customer") {
      setNarration(
        state.mode === "on"
          ? "A normal customer is still booking successfully. Rate limiting stays invisible for fair use."
          : "A normal customer can still book now, but flood traffic can quickly push the queue into unfair territory."
      );
      updateLogHint("Normal request accepted");
      return;
    }

    updateLogHint("Flood traffic accepted");
  }

  function sendLocalRequest(actor, options) {
    const { waitingOverride = false } = options || {};
    const requestId = nextRequestId(actor);

    state.totalRequests += 1;
    state.activeRequests += 1;
    updatePressure();

    let status = "allowed";

    if (actor === "bot") {
      trimBotWindow();
      if (state.mode === "on" && state.botWindow.length >= RATE_LIMIT_THRESHOLD) {
        status = "blocked";
      } else {
        state.botWindow.push(Date.now());
      }
    }

    if (actor === "customer" && waitingOverride) {
      status = "waiting";
    }

    trackResolvedRequest(status, actor, requestId);
    updateNarrationForLocal(status, actor);
  }

  async function sendLiveRequest(actor) {
    const requestId = nextRequestId(actor);
    const targetUrl = buildLiveTargetUrl();

    state.totalRequests += 1;
    state.activeRequests += 1;
    updatePressure();

    if (!targetUrl) {
      trackResolvedRequest("waiting", actor, requestId, "Missing live gateway URL");
      setLiveProofLastResult("Missing gateway base URL or target route");
      renderConnectionState();
      setNarration(
        "The live path is not configured yet. Add the gateway URL and route or switch back to the local simulation."
      );
      return;
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

      await refreshLiveProof();

      if (response.status === 429) {
        trackResolvedRequest("blocked", actor, requestId, "Real gateway returned 429 Too Many Requests");
        setLiveProofLastResult(`HTTP 429 on ${requestId}`);
        setNarration(
          "This is real proof now: the gateway route is returning 429 Too Many Requests once the burst crosses the configured limit."
        );
        updateLogHint("Real 429 responses are now visible");
      } else if (response.ok) {
        trackResolvedRequest("allowed", actor, requestId, `Live route returned HTTP ${response.status}`);
        setLiveProofLastResult(`HTTP ${response.status} on ${requestId}`);
        setNarration(
          actor === "customer"
            ? "Normal traffic is getting real success responses through the gateway route."
            : "The flood is still being accepted for now. Keep going until the route starts returning 429 if rate limiting is enabled."
        );
        updateLogHint(actor === "customer" ? "Real normal traffic accepted" : "Real flood traffic accepted");
      } else {
        trackResolvedRequest("waiting", actor, requestId, `Unexpected HTTP ${response.status}`);
        setLiveProofLastResult(`HTTP ${response.status} on ${requestId}`);
        setNarration(
          "The request reached the live route, but the response was not a normal success or a 429 block. The route may still be usable, but it is not ideal for this expo story."
        );
        updateLogHint("Unexpected live response");
      }
    } catch (error) {
      trackResolvedRequest("waiting", actor, requestId, `Browser could not reach the live gateway route: ${error.message}`);
      setLiveProofLastResult(`Connection error on ${requestId}`);
      setNarration(
        "The live gateway request could not be completed. The demo keeps its local fallback so the expo story still works offline."
      );
      updateLogHint("Live route unreachable");
    } finally {
      renderConnectionState();
    }
  }

  function finishFlood() {
    state.floodRunning = false;
    elements.summaryCard.classList.remove("hidden");

    if (!state.replayRunning) {
      setActionLocks(false);
      elements.normalButton.disabled = false;
    }

    if (state.connectionMode === "live") {
      if (state.spamBlocked > 0) {
        elements.summaryHeadline.textContent = "Real gateway started blocking the flood";
        elements.summaryText.textContent = `${state.spamAllowed} live flood requests were accepted and ${state.spamBlocked} came back as real 429 responses. Normal requests stayed visible in the same UI.`;
        setNarration(
          "Live mode proved the real platform behavior: the same gateway route allowed a few requests and then began returning 429 to slow the flood."
        );
      } else {
        elements.summaryHeadline.textContent = "Live flood did not hit 429 yet";
        elements.summaryText.textContent = `${state.spamAllowed} live flood requests were accepted and no 429 responses appeared yet. Check the platform rate-limit settings or lower the configured limit for a stronger expo run.`;
        setNarration(
          "The route is reachable, but the current live rate-limit setup did not produce 429 during this burst. The local mode is still available if you need guaranteed proof immediately."
        );
      }
      return;
    }

    if (state.mode === "on") {
      elements.summaryHeadline.textContent = "Flood slowed down, fair users still served";
      elements.summaryText.textContent = `${state.spamAllowed} spam requests were allowed, ${state.spamBlocked} were blocked with 429 responses, and normal visitors stayed able to book.`;
      setNarration(
        "With rate limiting ON, the flood loses momentum. The system stays available and fair for normal visitors."
      );
    } else {
      elements.summaryHeadline.textContent = "Flood dominated the line";
      elements.summaryText.textContent = `${state.spamAllowed} spam requests were accepted, none were blocked, and queue pressure climbed high enough to hurt fairness for real visitors.`;
      setNarration(
        "With rate limiting OFF, repeated bot traffic keeps entering and pushes the booking line into overload."
      );
    }
  }

  function getFloodDurationMs() {
    const speed = SPEED_MAP[elements.speedSelect.value] || SPEED_MAP.medium;
    const burst = Number(elements.burstSelect.value);
    return (burst - 1) * speed + 1600;
  }

  function startLocalFlood() {
    const speed = SPEED_MAP[elements.speedSelect.value] || SPEED_MAP.medium;
    const burst = Number(elements.burstSelect.value);

    setNarration(
      state.mode === "on"
        ? "The bot is flooding the booking system. The first few requests may pass, but the gate will start returning 429 Too Many Requests."
        : "The bot is flooding the booking system with no limit in place. Watch the queue pressure rise and the flood keep getting in."
    );
    updateLogHint("Flood in progress");

    for (let index = 0; index < burst; index += 1) {
      registerTimer(() => {
        sendLocalRequest("bot");

        if (state.mode === "off" && index === Math.floor(burst / 3)) {
          registerTimer(() => sendLocalRequest("customer", { waitingOverride: true }), 90);
        }

        if (state.mode === "on" && index === Math.floor(burst / 2)) {
          registerTimer(() => sendLocalRequest("customer"), 120);
        }

        if (index === burst - 1) {
          registerTimer(finishFlood, 1600);
        }
      }, index * speed);
    }
  }

  function startLiveFlood() {
    const speed = SPEED_MAP[elements.speedSelect.value] || SPEED_MAP.medium;
    const burst = Number(elements.burstSelect.value);

    setNarration(
      "Live flood mode is sending real repeated requests through the gateway route. Watch the log for genuine HTTP 429 once the configured limit is crossed."
    );
    updateLogHint("Live flood in progress");

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

  function startSpamFlood() {
    if (state.floodRunning || state.replayRunning) {
      return;
    }

    state.floodRunning = true;
    elements.summaryCard.classList.add("hidden");
    setActionLocks(true);
    elements.normalButton.disabled = false;

    if (state.connectionMode === "live") {
      startLiveFlood();
      return;
    }

    startLocalFlood();
  }

  function sendNormalRequest() {
    if (state.replayRunning) {
      return;
    }

    elements.summaryCard.classList.add("hidden");

    if (state.connectionMode === "live") {
      setNarration(
        "Live normal mode sends a small safe burst through the real gateway route to show that ordinary traffic still succeeds before any flood starts."
      );
      updateLogHint("Sending live normal traffic");
      for (let index = 0; index < LIVE_NORMAL_REQUESTS; index += 1) {
        registerTimer(() => void sendLiveRequest("customer"), index * 450);
      }
      return;
    }

    sendLocalRequest("customer", {
      waitingOverride: state.mode === "off" && state.floodRunning && state.activeRequests >= 5,
    });
  }

  function setMode(nextMode) {
    if (state.floodRunning || state.connectionMode === "live") {
      return;
    }

    state.mode = nextMode;
    updateModeUI();
    setNarration(
      nextMode === "on"
        ? "Rate limiting is ON. Regular visitors stay unaffected, but repeated flooding will start receiving 429 Too Many Requests."
        : "Rate limiting is OFF. Flood traffic can keep entering, crowd the queue, and make the system unfair for normal visitors."
    );
  }

  function resetDemo(options) {
    const { preserveTimers = false } = options || {};

    if (!preserveTimers) {
      clearAllTimers();
    }
    state.totalRequests = 0;
    state.normalAllowed = 0;
    state.spamAllowed = 0;
    state.spamBlocked = 0;
    state.pressure = "low";
    state.activeRequests = 0;
    state.floodRunning = false;
    state.replayRunning = false;
    state.requestId = 1;
    state.botWindow = [];
    state.logEntries = [];
    state.liveProof.lastResult = "No live request yet";

    clearLanes();
    elements.eventLogBody.innerHTML = "";
    elements.summaryCard.classList.add("hidden");
    elements.normalButton.disabled = false;
    updateCounters();
    updatePressure();
    updateModeUI();
    updateLogHint("Waiting for traffic");

    if (state.connectionMode === "live") {
      setNarration(
        "Live mode keeps the same queue story, but the real gateway response now decides whether each request is accepted or blocked with 429."
      );
    } else {
      setNarration(
        state.mode === "on"
          ? "Rate limiting is ON. Regular visitors should not feel it, but repeated flooding will be blocked with 429 responses."
          : "Rate limiting is OFF. Flood traffic can rush through and crowd out fair users."
      );
    }

    setActionLocks(false);
    renderConnectionState();
  }

  function replayGuidedDemo() {
    if (state.replayRunning || state.floodRunning || state.connectionMode === "live") {
      return;
    }

    resetDemo();
    state.replayRunning = true;
    elements.normalButton.disabled = true;
    setActionLocks(true);

    setMode("on");
    setNarration("Guided replay: first show that a normal customer books successfully with protection ON.");

    registerTimer(() => sendLocalRequest("customer"), 500);
    registerTimer(() => {
      setMode("off");
      setNarration("Now protection is OFF. The same flood can crowd the booking line unchecked.");
    }, 1900);
    registerTimer(() => {
      state.replayRunning = false;
      startSpamFlood();
      state.replayRunning = true;
    }, 2600);
    const secondPhaseAt = 2600 + getFloodDurationMs() + 900;
    registerTimer(() => {
      resetDemo({ preserveTimers: true });
      state.replayRunning = true;
      setMode("on");
      setNarration("Now we replay the same flood with protection ON.");
      state.replayRunning = false;
      startSpamFlood();
      state.replayRunning = true;

      registerTimer(() => {
        state.replayRunning = false;
        setActionLocks(false);
        elements.normalButton.disabled = false;
        setNarration(
          "Replay complete. Compare the blocked counter, 429 log entries, and queue pressure to see how fairness is preserved."
        );
      }, getFloodDurationMs() + 900);
    }, secondPhaseAt);
  }

  function renderConnectionState() {
    const liveMode = state.connectionMode === "live";
    elements.connectionModeBadge.textContent = liveMode ? "Live Gateway Mode" : "Local Simulation";
    elements.connectionModeSelect.value = state.connectionMode;
    elements.liveConfigFields.hidden = !liveMode;
    elements.gatewayBaseUrlInput.value = state.liveConfig.gatewayBaseUrl;
    elements.targetRouteInput.value = state.liveConfig.targetRoute;
    elements.platformApiBaseInput.value = state.liveConfig.platformApiBase;
    elements.liveProofCard.hidden = !liveMode;

    if (liveMode) {
      elements.liveProofService.textContent = state.liveProof.serviceName || "Not configured";
      elements.liveProofTarget.textContent = state.liveProof.targetLabel || "Not configured";
      elements.liveProofConfig.textContent = state.liveProof.configSummary || "Unknown";
      elements.liveProofLastResult.textContent = state.liveProof.lastResult || "No live request yet";
      elements.liveProofSource.textContent = state.liveProof.source || "Gateway responses only";
    }
  }

  elements.modeToggle.addEventListener("click", () => {
    setMode(state.mode === "on" ? "off" : "on");
  });
  elements.normalButton.addEventListener("click", sendNormalRequest);
  elements.spamButton.addEventListener("click", startSpamFlood);
  elements.resetButton.addEventListener("click", resetDemo);
  elements.replayButton.addEventListener("click", replayGuidedDemo);

  elements.connectionModeSelect.addEventListener("change", (event) => {
    state.connectionMode = event.target.value;
    resetDemo();
  });

  elements.gatewayBaseUrlInput.addEventListener("input", (event) => {
    state.liveConfig.gatewayBaseUrl = event.target.value;
    void refreshLiveProof().then(renderConnectionState);
  });

  elements.targetRouteInput.addEventListener("input", (event) => {
    state.liveConfig.targetRoute = event.target.value;
    void refreshLiveProof().then(renderConnectionState);
  });

  elements.platformApiBaseInput.addEventListener("input", (event) => {
    state.liveConfig.platformApiBase = event.target.value;
    void refreshLiveProof().then(renderConnectionState);
  });

  elements.liveDefaultsButton.addEventListener("click", () => {
    state.liveConfig = { ...LIVE_DEFAULTS };
    void refreshLiveProof().then(renderConnectionState);
  });

  resetDemo();
})();

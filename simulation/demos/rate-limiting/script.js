(function () {
  const RATE_LIMIT_THRESHOLD = 5;
  const RATE_LIMIT_WINDOW_MS = 3000;

  const SPEED_MAP = {
    slow: 420,
    medium: 220,
    fast: 110,
  };

  const state = {
    mode: "on",
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

  function setMode(nextMode) {
    if (state.floodRunning) {
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

  function updateModeUI() {
    const protectedMode = state.mode === "on";
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
    elements.narrationText.textContent = text;
  }

  function setActionLocks(disabled) {
    elements.modeToggle.disabled = disabled;
    elements.speedSelect.disabled = disabled;
    elements.burstSelect.disabled = disabled;
    elements.replayButton.disabled = disabled;
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

  function addVisualRequest(actor, status, requestId) {
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
        status === "blocked"
          ? "Rate limit exceeded"
          : status === "waiting"
            ? "Queue pressure is high"
            : actor === "customer"
              ? "Normal traffic"
              : "Inside allowed burst",
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

  function sendRequest(actor, options) {
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

    if (status === "allowed") {
      if (actor === "customer") {
        state.normalAllowed += 1;
      } else {
        state.spamAllowed += 1;
      }
    } else if (status === "blocked") {
      state.spamBlocked += 1;
    }

    addVisualRequest(actor, status, requestId);
    updateCounters();
    flashServer(status);

    registerTimer(() => {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
      updatePressure();
    }, status === "blocked" ? 650 : 1200);

    if (status === "blocked") {
      setNarration(
        "The gate is now rejecting repeated bot requests with 429 Too Many Requests, while genuine visitors can still get through."
      );
      updateLogHint("Blocked events are visible now");
    } else if (status === "waiting") {
      setNarration(
        "Without rate limiting, flood traffic is crowding the line. Real visitors start feeling delay and unfairness."
      );
      updateLogHint("Queue pressure is affecting normal traffic");
    } else if (actor === "customer") {
      setNarration(
        state.mode === "on"
          ? "A normal customer is still booking successfully. Rate limiting stays invisible for fair use."
          : "A normal customer can still book now, but flood traffic can quickly push the queue into unfair territory."
      );
      updateLogHint("Normal request accepted");
    } else {
      updateLogHint("Flood traffic accepted");
    }
  }

  function finishFlood() {
    state.floodRunning = false;
    elements.summaryCard.classList.remove("hidden");

    if (!state.replayRunning) {
      setActionLocks(false);
      elements.normalButton.disabled = false;
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

  function startSpamFlood() {
    if (state.floodRunning || state.replayRunning) {
      return;
    }

    state.floodRunning = true;
    elements.summaryCard.classList.add("hidden");
    setActionLocks(true);
    elements.normalButton.disabled = false;

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
        sendRequest("bot");

        if (state.mode === "off" && index === Math.floor(burst / 3)) {
          registerTimer(() => sendRequest("customer", { waitingOverride: true }), 90);
        }

        if (state.mode === "on" && index === Math.floor(burst / 2)) {
          registerTimer(() => sendRequest("customer"), 120);
        }

        if (index === burst - 1) {
          registerTimer(finishFlood, 1600);
        }
      }, index * speed);
    }
  }

  function sendNormalRequest() {
    if (state.replayRunning) {
      return;
    }

    elements.summaryCard.classList.add("hidden");
    sendRequest("customer", {
      waitingOverride: state.mode === "off" && state.floodRunning && state.activeRequests >= 5,
    });
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

    clearLanes();
    elements.eventLogBody.innerHTML = "";
    elements.summaryCard.classList.add("hidden");
    elements.normalButton.disabled = false;
    setActionLocks(false);
    updateCounters();
    updatePressure();
    updateModeUI();
    updateLogHint("Waiting for traffic");
    setNarration(
      state.mode === "on"
        ? "Rate limiting is ON. Regular visitors should not feel it, but repeated flooding will be blocked with 429 responses."
        : "Rate limiting is OFF. Flood traffic can rush through and crowd out fair users."
    );
  }

  function getFloodDurationMs() {
    const speed = SPEED_MAP[elements.speedSelect.value] || SPEED_MAP.medium;
    const burst = Number(elements.burstSelect.value);
    return (burst - 1) * speed + 1600;
  }

  function replayGuidedDemo() {
    if (state.replayRunning || state.floodRunning) {
      return;
    }

    resetDemo();
    state.replayRunning = true;
    elements.normalButton.disabled = true;
    setActionLocks(true);

    setMode("on");
    setNarration("Guided replay: first show that a normal customer books successfully with protection ON.");

    registerTimer(() => sendRequest("customer"), 500);
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

  elements.modeToggle.addEventListener("click", () => {
    setMode(state.mode === "on" ? "off" : "on");
  });
  elements.normalButton.addEventListener("click", sendNormalRequest);
  elements.spamButton.addEventListener("click", startSpamFlood);
  elements.resetButton.addEventListener("click", resetDemo);
  elements.replayButton.addEventListener("click", replayGuidedDemo);

  resetDemo();
})();

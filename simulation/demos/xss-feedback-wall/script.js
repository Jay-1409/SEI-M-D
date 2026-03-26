const seededComments = [
  { id: "seed-1", author: "Riya", text: "Loved the robotics booth.", timeLabel: "2 min ago", kind: "safe" },
  { id: "seed-2", author: "Kabir", text: "The security project explanation was very clear.", timeLabel: "4 min ago", kind: "safe" },
  { id: "seed-3", author: "Neha", text: "Great event management and good demos.", timeLabel: "7 min ago", kind: "safe" },
];

const normalPreset = { author: "Aarav", text: "Great event. The project demos were easy to understand." };
const attackPreset = { author: "Attacker", text: "<script>document.getElementById('demo-banner').innerText='Page Manipulated';</script>" };
const suspiciousPatterns = [/<script/i, /onerror\s*=/i, /onload\s*=/i, /javascript:/i];
const LIVE_DEFAULTS = {
  gatewayBaseUrl: "http://localhost:30080",
  commentsRoute: "/expo-xss-demo/comments",
  platformApiBase: "http://localhost:30000/api",
};

const state = {
  protectionEnabled: false,
  connectionMode: "local",
  liveConfig: { ...LIVE_DEFAULTS },
  connectionStatus: {
    tone: "info",
    message: "Local simulation is ready. Switch to live mode after the XSS target service is deployed behind the gateway.",
  },
  requestInFlight: false,
  comments: cloneSeededComments(),
  blockCount: 0,
  statusType: "idle",
  statusMessage: "Choose a comment type and submit it to start the demo.",
  lastAction: "Waiting for first submission",
  formFeedback: "",
  formFeedbackType: "",
  unsafeBannerActive: false,
  eventProof: null,
  timeline: [],
  requestPreview: "",
  liveProof: { serviceName: "", source: "Gateway response only", xssBlocks: null, latestEvent: "" },
};

const elements = {
  form: document.getElementById("comment-form"),
  toggle: document.getElementById("protection-toggle"),
  toggleStateText: document.getElementById("toggle-state-text"),
  modeHelper: document.getElementById("mode-helper"),
  connectionModeBadge: document.getElementById("connection-mode-badge"),
  connectionModeSelect: document.getElementById("connection-mode-select"),
  liveConfigFields: document.getElementById("live-config-fields"),
  gatewayBaseUrlInput: document.getElementById("gateway-base-url-input"),
  commentsRouteInput: document.getElementById("comments-route-input"),
  platformApiBaseInput: document.getElementById("platform-api-base-input"),
  liveDefaultsButton: document.getElementById("live-defaults-button"),
  syncLiveButton: document.getElementById("sync-live-button"),
  connectionStatusCard: document.getElementById("connection-status-card"),
  nameInput: document.getElementById("name-input"),
  commentInput: document.getElementById("comment-input"),
  submitButton: document.getElementById("submit-button"),
  resetButton: document.getElementById("reset-button"),
  presetNormal: document.getElementById("preset-normal"),
  presetAttack: document.getElementById("preset-attack"),
  formFeedback: document.getElementById("form-feedback"),
  commentList: document.getElementById("comment-list"),
  commentCountLabel: document.getElementById("comment-count-label"),
  demoBanner: document.getElementById("demo-banner"),
  bannerMessage: document.getElementById("banner-message"),
  sessionPill: document.getElementById("session-pill"),
  statusBadge: document.getElementById("status-badge"),
  protectionBadge: document.getElementById("protection-badge"),
  statusMessage: document.getElementById("status-message"),
  lastAction: document.getElementById("last-action"),
  blockCount: document.getElementById("block-count"),
  eventProofTag: document.getElementById("event-proof-tag"),
  eventProofDetails: document.getElementById("event-proof-details"),
  requestPreview: document.getElementById("request-preview"),
  requestRouteTag: document.getElementById("request-route-tag"),
  liveProofCard: document.getElementById("live-proof-card"),
  liveProofService: document.getElementById("live-proof-service"),
  liveProofBlocks: document.getElementById("live-proof-blocks"),
  liveProofEvent: document.getElementById("live-proof-event"),
  liveProofSource: document.getElementById("live-proof-source"),
  timelineList: document.getElementById("timeline-list"),
};

wireEvents();
state.requestPreview = buildRequestPreview("Visitor 1", "");
render();

function wireEvents() {
  elements.toggle.addEventListener("change", () => {
    state.protectionEnabled = elements.toggle.checked;
    clearFeedback();
    state.requestPreview = buildRequestPreview(currentAuthor(), currentComment());
    render();
  });
  elements.connectionModeSelect.addEventListener("change", handleModeChange);
  [elements.gatewayBaseUrlInput, elements.commentsRouteInput, elements.platformApiBaseInput].forEach((input) => {
    input.addEventListener("input", handleLiveConfigChange);
  });
  elements.liveDefaultsButton.addEventListener("click", () => {
    state.liveConfig = { ...LIVE_DEFAULTS };
    setConnectionStatus("info", "Live defaults loaded for the simulation-owned XSS target service.");
    state.requestPreview = buildRequestPreview(currentAuthor(), currentComment());
    render();
    if (state.connectionMode === "live") {
      loadLiveComments();
    }
  });
  elements.syncLiveButton.addEventListener("click", () => {
    if (state.connectionMode === "live") {
      loadLiveComments();
    } else {
      setConnectionStatus("info", "Switch to live mode first if you want to load comments from the gateway route.");
      renderConnectionState();
    }
  });
  elements.presetNormal.addEventListener("click", () => applyPreset(normalPreset));
  elements.presetAttack.addEventListener("click", () => applyPreset(attackPreset));
  elements.form.addEventListener("submit", handleSubmit);
  elements.resetButton.addEventListener("click", resetDemo);
  [elements.nameInput, elements.commentInput].forEach((input) => {
    input.addEventListener("input", () => {
      state.requestPreview = buildRequestPreview(currentAuthor(), currentComment());
      renderRequestPreview();
    });
  });
}

async function handleModeChange(event) {
  state.connectionMode = event.target.value;
  clearFeedback();
  if (state.connectionMode === "local") {
    state.comments = cloneSeededComments();
    state.unsafeBannerActive = false;
    state.liveProof = { serviceName: "", source: "Gateway response only", xssBlocks: null, latestEvent: "" };
    setConnectionStatus("info", "Local simulation is ready. Switch to live mode after the XSS target service is deployed behind the gateway.");
    state.requestPreview = buildRequestPreview(currentAuthor(), currentComment());
    render();
    return;
  }
  setConnectionStatus("warning", "Live mode uses the real gateway. If the target service or WAF setup is incomplete, the proof panel will explain what to fix.");
  state.requestPreview = buildRequestPreview(currentAuthor(), currentComment());
  render();
  await loadLiveComments();
}

function handleLiveConfigChange() {
  state.liveConfig.gatewayBaseUrl = elements.gatewayBaseUrlInput.value;
  state.liveConfig.commentsRoute = elements.commentsRouteInput.value;
  state.liveConfig.platformApiBase = elements.platformApiBaseInput.value;
  state.requestPreview = buildRequestPreview(currentAuthor(), currentComment());
  render();
}

function applyPreset(preset) {
  elements.nameInput.value = preset.author;
  elements.commentInput.value = preset.text;
  clearFeedback();
  state.requestPreview = buildRequestPreview(preset.author, preset.text);
  render();
}

async function handleSubmit(event) {
  event.preventDefault();
  const author = currentAuthor();
  const comment = currentComment();
  if (!author || !comment) {
    setFormFeedback("Please enter both a name and a comment.", "error");
    render();
    return;
  }

  state.requestPreview = buildRequestPreview(author, comment);
  state.requestInFlight = true;
  renderConnectionState();
  renderRequestPreview();

  if (state.connectionMode === "local") {
    await wait(480);
    processLocalSubmission(author, comment);
  } else {
    await processLiveSubmission(author, comment);
  }

  state.requestInFlight = false;
  render();
}

function processLocalSubmission(author, comment) {
  const malicious = isSuspicious(comment);
  if (malicious && state.protectionEnabled) {
    state.blockCount += 1;
    setBlockedState("/feedback/submit", "Script-like content detected in comment field", "The gateway stopped a dangerous comment before it could reach the public wall.");
    setConnectionStatus("info", "Local simulation blocked the suspicious comment because protection is ON.");
    return;
  }
  if (malicious) {
    acceptComment({ id: `comment-${Date.now()}`, author, text: comment, timeLabel: "Just now", kind: "malicious" });
    state.statusType = "warning";
    state.statusMessage = "Dangerous script-style content was accepted because protection is OFF.";
    state.lastAction = "Unsafe comment reached the page";
    setFormFeedback("Dangerous content reached the page because protection is OFF.", "error");
    state.eventProof = proofCard("No gateway block occurred", "warning", [
      ["Attack type", "XSS-style comment"],
      ["Route", "/feedback/submit"],
      ["Field", "comment"],
      ["Decision", "Accepted"],
      ["Reason", "Protection was OFF"],
      ["Time", "Just now"],
    ]);
    pushTimeline("Warning", "A dangerous comment was accepted and the page warning changed to show the risk.");
    setConnectionStatus("info", "Local simulation accepted the suspicious comment because protection is OFF.");
    return;
  }
  acceptComment({ id: `comment-${Date.now()}`, author, text: comment, timeLabel: "Just now", kind: "safe" });
  state.statusType = "safe";
  state.statusMessage = "Normal text comment accepted. No attack pattern detected.";
  state.lastAction = "Comment posted successfully";
  setFormFeedback("Safe comment posted. No harmful script pattern found.", "success");
  state.eventProof = proofCard("Safe request", "safe", [
    ["Request type", "Normal comment"],
    ["Route", "/feedback/submit"],
    ["Field", "comment"],
    ["Decision", "Allowed"],
    ["Reason", "Plain text comment"],
    ["Time", "Just now"],
  ]);
  pushTimeline("Safe Activity", "A normal public comment was accepted and shown on the wall.");
  setConnectionStatus("info", "Local simulation accepted the normal comment.");
}

async function processLiveSubmission(author, comment) {
  const url = buildCommentsUrl();
  const route = normalizeRoutePath(state.liveConfig.commentsRoute) || "/comments";
  const malicious = isSuspicious(comment);
  if (!url) {
    state.statusType = "idle";
    state.statusMessage = "Live mode needs setup before it can send traffic.";
    state.lastAction = "Missing live configuration";
    setFormFeedback("Add a gateway URL and comments route before using live mode.", "error");
    state.eventProof = proofCard("Check live setup", "neutral", [
      ["Mode", "Live gateway"],
      ["Required field", "Gateway Base URL"],
      ["Required route", "Comments Route"],
      ["Decision", "No request sent"],
      ["Reason", "Live target is not configured"],
      ["Time", "Just now"],
    ]);
    pushTimeline("Live Setup Needed", "The demo stayed safe because the live gateway route was not configured yet.");
    setConnectionStatus("warning", "Live mode needs a gateway base URL and comments route before it can send traffic.");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, comment }),
    });
    const payload = await parseResponseBody(response);
    await refreshLiveProof();

    if (response.status === 403 && looksLikeXssBlock(payload, malicious)) {
      state.blockCount += 1;
      setBlockedState(route, extractReason(payload, "Blocked by gateway WAF"), `The real gateway returned HTTP ${response.status} and stopped the dangerous comment.`);
      setConnectionStatus("success", `Live gateway blocked the suspicious comment with HTTP ${response.status}.`);
      return;
    }

    if (response.ok && typeof payload === "object" && payload?.result === "accepted") {
      if (Array.isArray(payload.comments)) {
        state.comments = payload.comments.map(mapLiveComment);
        state.unsafeBannerActive = state.comments.some((item) => item.kind === "malicious");
      }
      if (payload.comment_kind === "malicious") {
        state.statusType = "warning";
        state.statusMessage = "Dangerous script-style content was accepted because the live route was not protected.";
        state.lastAction = "Unsafe comment reached the page";
        setFormFeedback("Dangerous content reached the live page because XSS protection is OFF.", "error");
        state.eventProof = proofCard("No gateway block occurred", "warning", [
          ["Attack type", "XSS-style comment"],
          ["Route", route],
          ["Field", "comment"],
          ["Decision", "Accepted"],
          ["Reason", extractReason(payload, "Gateway forwarded the suspicious comment")],
          ["Time", "Just now"],
        ]);
        pushTimeline("Warning", `The real gateway forwarded the payload and the live service accepted it with HTTP ${response.status}.`);
        setConnectionStatus("warning", `Live gateway forwarded the suspicious comment with HTTP ${response.status}. This means XSS protection is currently OFF for this route.`);
        return;
      }

      state.statusType = "safe";
      state.statusMessage = "Normal text comment accepted. No attack pattern detected.";
      state.lastAction = "Comment posted successfully";
      setFormFeedback("Safe comment posted through the live gateway.", "success");
      state.eventProof = proofCard("Safe request", "safe", [
        ["Request type", "Normal comment"],
        ["Route", route],
        ["Field", "comment"],
        ["Decision", "Allowed"],
        ["Reason", extractReason(payload, "Live service accepted the clean comment")],
        ["Time", "Just now"],
      ]);
      pushTimeline("Safe Activity", `A normal comment passed through the real gateway and was accepted with HTTP ${response.status}.`);
      setConnectionStatus("success", `Live gateway accepted the normal comment with HTTP ${response.status}.`);
      return;
    }

    state.statusType = "idle";
    state.statusMessage = "The live route responded, but not in the expected expo demo format.";
    state.lastAction = "Unexpected live response";
    setFormFeedback("The target replied, but the response format does not match the demo service.", "error");
    state.eventProof = proofCard("Check live setup", "neutral", [
      ["Mode", "Live gateway"],
      ["Route", route],
      ["Decision", `HTTP ${response.status}`],
      ["Reason", "Unexpected live response"],
      ["Preview", summarizePayload(payload) || "No payload"],
      ["Time", "Just now"],
    ]);
    pushTimeline("Live Setup Needed", "The gateway responded, but the target service did not return the expected expo demo payload.");
    setConnectionStatus("warning", `The live route responded with HTTP ${response.status}, but not in the expected expo demo format.`);
  } catch (error) {
    state.statusType = "idle";
    state.statusMessage = "The browser could not reach the live gateway route.";
    state.lastAction = "Live request failed";
    setFormFeedback("Could not reach the configured live gateway route.", "error");
    state.eventProof = proofCard("Check live setup", "neutral", [
      ["Mode", "Live gateway"],
      ["Target", url],
      ["Decision", "No response"],
      ["Reason", error.message],
      ["Hint", "Switch back to local mode if needed"],
      ["Time", "Just now"],
    ]);
    pushTimeline("Live Request Failed", "The demo could not reach the gateway route, so the local fallback is still available.");
    setConnectionStatus("error", "The browser could not reach the live gateway route.");
  }
}

async function loadLiveComments() {
  const url = buildCommentsUrl();
  if (!url) {
    setConnectionStatus("warning", "Add a gateway base URL and comments route to load the live feedback wall.");
    render();
    return;
  }
  state.requestInFlight = true;
  renderConnectionState();
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const payload = await parseResponseBody(response);
    if (!response.ok || typeof payload !== "object" || !Array.isArray(payload.comments)) {
      setConnectionStatus("warning", `The live wall responded with HTTP ${response.status}, but the comment list was not in the expected format.`);
      return;
    }
    state.comments = payload.comments.map(mapLiveComment);
    state.unsafeBannerActive = state.comments.some((item) => item.kind === "malicious");
    clearFeedback();
    await refreshLiveProof();
    setConnectionStatus("success", `Live wall loaded from ${url}.`);
  } catch (error) {
    setConnectionStatus("error", "The browser could not load comments from the live gateway route.");
  } finally {
    state.requestInFlight = false;
    render();
  }
}

async function refreshLiveProof() {
  const apiBase = normalizeBaseUrl(state.liveConfig.platformApiBase);
  const serviceName = inferServiceName(state.liveConfig.commentsRoute);
  state.liveProof = { serviceName: serviceName || "", source: "Gateway response only", xssBlocks: null, latestEvent: "" };
  if (!apiBase || !serviceName) {
    return;
  }
  try {
    const [statsResponse, eventsResponse] = await Promise.all([
      fetch(`${apiBase}/services/${serviceName}/waf/stats`),
      fetch(`${apiBase}/services/${serviceName}/waf/events?limit=5`),
    ]);
    if (!statsResponse.ok || !eventsResponse.ok) {
      return;
    }
    const statsPayload = await statsResponse.json();
    const eventsPayload = await eventsResponse.json();
    const latest = Array.isArray(eventsPayload.events) ? eventsPayload.events[0] : null;
    state.liveProof.source = "Gateway WAF stats + events";
    state.liveProof.xssBlocks = statsPayload.by_type?.xss ?? 0;
    state.liveProof.latestEvent = latest ? `${latest.attack_type || "unknown"} on ${latest.field || "unknown field"}` : "No blocked event recorded yet";
  } catch (error) {
    state.liveProof.source = "Gateway response only";
  }
}

async function resetDemo() {
  elements.toggle.checked = false;
  state.protectionEnabled = false;
  state.blockCount = 0;
  state.statusType = "idle";
  state.statusMessage = "Choose a comment type and submit it to start the demo.";
  state.lastAction = "Waiting for first submission";
  state.eventProof = null;
  state.timeline = [];
  clearFeedback();
  elements.nameInput.value = "Visitor 1";
  elements.commentInput.value = "";
  state.requestPreview = buildRequestPreview("Visitor 1", "");

  if (state.connectionMode === "local") {
    state.comments = cloneSeededComments();
    state.unsafeBannerActive = false;
    setConnectionStatus("info", "Local simulation reset. The wall is back to the seeded safe comments.");
    render();
    return;
  }

  const resetUrl = buildResetUrl();
  if (!resetUrl) {
    state.comments = cloneSeededComments();
    state.unsafeBannerActive = false;
    setConnectionStatus("warning", "Live mode reset needs a configured service route. The page returned to a safe local-looking state.");
    render();
    return;
  }

  state.requestInFlight = true;
  renderConnectionState();
  try {
    const response = await fetch(resetUrl, { method: "POST", headers: { "Content-Type": "application/json" } });
    const payload = await parseResponseBody(response);
    if (response.ok && typeof payload === "object" && Array.isArray(payload.comments)) {
      state.comments = payload.comments.map(mapLiveComment);
      state.unsafeBannerActive = false;
      await refreshLiveProof();
      setConnectionStatus("success", "Live wall reset through the real gateway target service.");
    } else {
      state.comments = cloneSeededComments();
      state.unsafeBannerActive = false;
      setConnectionStatus("warning", `Live reset returned HTTP ${response.status}, so the UI fell back to a safe local state.`);
    }
  } catch (error) {
    state.comments = cloneSeededComments();
    state.unsafeBannerActive = false;
    setConnectionStatus("error", "Could not reset the live wall through the gateway route. The UI returned to a safe local state.");
  } finally {
    state.requestInFlight = false;
    render();
  }
}

function render() {
  renderMode();
  renderConnectionState();
  renderBanner();
  renderComments();
  renderStatus();
  renderEventProof();
  renderRequestPreview();
  renderLiveProof();
  renderTimeline();
  renderFormFeedback();
}

function renderMode() {
  elements.toggleStateText.textContent = state.protectionEnabled ? "Protection ON" : "Protection OFF";
  elements.modeHelper.textContent = state.protectionEnabled
    ? "Protected mode: dangerous script-style comments will be blocked at the gateway."
    : "Unsafe mode: the page is not filtering dangerous script-style comments.";
  elements.protectionBadge.textContent = state.protectionEnabled ? "Protection ON" : "Protection OFF";
  elements.protectionBadge.className = `mini-badge ${state.protectionEnabled ? "on" : "off"}`;
}

function renderConnectionState() {
  elements.connectionModeBadge.textContent = state.connectionMode === "local" ? "Local Simulation" : "Live Gateway Mode";
  elements.connectionModeBadge.className = `mode-badge ${state.connectionMode}`;
  elements.connectionModeSelect.value = state.connectionMode;
  elements.liveConfigFields.hidden = state.connectionMode !== "live";
  elements.gatewayBaseUrlInput.value = state.liveConfig.gatewayBaseUrl;
  elements.commentsRouteInput.value = state.liveConfig.commentsRoute;
  elements.platformApiBaseInput.value = state.liveConfig.platformApiBase;
  elements.connectionStatusCard.textContent = state.connectionStatus.message;
  elements.connectionStatusCard.className = `connection-status-card ${state.connectionStatus.tone}`;
  elements.submitButton.disabled = state.requestInFlight;
  elements.syncLiveButton.disabled = state.requestInFlight;
  elements.liveDefaultsButton.disabled = state.requestInFlight;
  elements.submitButton.textContent = state.requestInFlight
    ? (state.connectionMode === "local" ? "Posting..." : "Calling Gateway...")
    : "Post Comment";
}

function renderBanner() {
  if (state.unsafeBannerActive) {
    elements.demoBanner.className = "demo-banner warning";
    elements.bannerMessage.textContent = "Warning: page content was modified by a dangerous comment";
    elements.sessionPill.textContent = "Visitor session at risk";
    elements.sessionPill.className = "session-pill risk";
  } else {
    elements.demoBanner.className = "demo-banner safe";
    elements.bannerMessage.textContent = state.connectionMode === "live"
      ? "Feedback wall is showing the latest comments returned by the live gateway route."
      : "Feedback wall is showing normal public comments.";
    elements.sessionPill.textContent = "Visitor session safe";
    elements.sessionPill.className = "session-pill safe";
  }
}

function renderComments() {
  elements.commentList.innerHTML = "";
  state.comments.forEach((comment) => {
    const card = document.createElement("article");
    card.className = `comment-card ${comment.kind}`;
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = getInitials(comment.author);
    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const author = document.createElement("strong");
    author.textContent = comment.author;
    const time = document.createElement("span");
    time.className = "time-label";
    time.textContent = comment.timeLabel;
    const kind = document.createElement("span");
    kind.className = `kind-pill ${comment.kind}`;
    kind.textContent = comment.kind === "malicious" ? "Dangerous comment" : "Safe comment";
    meta.append(author, time, kind);
    const body = document.createElement("div");
    body.className = "comment-body";
    if (comment.kind === "malicious") {
      const intro = document.createElement("p");
      intro.textContent = "This public post contains hidden script-style code instead of normal feedback.";
      const code = document.createElement("code");
      code.textContent = comment.text;
      body.append(intro, code);
    } else {
      body.textContent = comment.text;
    }
    const content = document.createElement("div");
    content.append(meta, body);
    card.append(avatar, content);
    elements.commentList.append(card);
  });
  elements.commentCountLabel.textContent = `${state.comments.length} visible comments`;
}

function renderStatus() {
  const label = { idle: "Idle", safe: "Safe Activity", warning: "Warning", blocked: "Attack Blocked" }[state.statusType];
  elements.statusBadge.textContent = label;
  elements.statusBadge.className = `status-badge ${state.statusType}`;
  elements.statusMessage.textContent = state.statusMessage;
  elements.lastAction.textContent = state.lastAction;
  elements.blockCount.textContent = String(state.blockCount);
}

function renderEventProof() {
  if (!state.eventProof) {
    elements.eventProofTag.textContent = "No gateway event yet";
    elements.eventProofTag.className = "proof-tag neutral";
    elements.eventProofDetails.innerHTML = "";
    return;
  }
  elements.eventProofTag.textContent = state.eventProof.tag;
  elements.eventProofTag.className = `proof-tag ${state.eventProof.tagType}`;
  elements.eventProofDetails.innerHTML = "";
  state.eventProof.details.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    elements.eventProofDetails.append(dt, dd);
  });
}

function renderRequestPreview() {
  elements.requestPreview.textContent = state.requestPreview;
  elements.requestRouteTag.textContent = state.connectionMode === "local"
    ? "/feedback/submit"
    : normalizeRoutePath(state.liveConfig.commentsRoute) || "/comments";
}

function renderLiveProof() {
  elements.liveProofCard.hidden = state.connectionMode !== "live";
  if (state.connectionMode !== "live") {
    return;
  }
  elements.liveProofService.textContent = state.liveProof.serviceName || inferServiceName(state.liveConfig.commentsRoute) || "Not configured";
  elements.liveProofBlocks.textContent = state.liveProof.xssBlocks == null ? "Unknown" : String(state.liveProof.xssBlocks);
  elements.liveProofEvent.textContent = state.liveProof.latestEvent || "No live event loaded";
  elements.liveProofSource.textContent = state.liveProof.source;
}

function renderTimeline() {
  elements.timelineList.innerHTML = "";
  if (!state.timeline.length) {
    elements.timelineList.innerHTML = '<div class="timeline-item"><strong>No actions yet</strong><p>Use a preset and submit it to create visible proof for visitors.</p></div>';
    return;
  }
  state.timeline.forEach((item) => {
    const row = document.createElement("div");
    row.className = "timeline-item";
    row.innerHTML = `<strong>${item.title} - ${item.timeLabel}</strong><p>${item.description}</p>`;
    elements.timelineList.append(row);
  });
}

function renderFormFeedback() {
  elements.formFeedback.textContent = state.formFeedback;
  elements.formFeedback.className = state.formFeedbackType ? `form-feedback ${state.formFeedbackType}` : "form-feedback";
}

function setBlockedState(route, reason, timelineText) {
  state.statusType = "blocked";
  state.statusMessage = "Dangerous script content was detected and blocked before reaching the page.";
  state.lastAction = "XSS attempt blocked";
  setFormFeedback("Comment rejected: dangerous script-like content is not allowed.", "error");
  state.eventProof = proofCard("Blocked XSS Event", "blocked", [
    ["Attack type", "XSS"],
    ["Route", route],
    ["Field", "comment"],
    ["Decision", "Blocked"],
    ["Reason", reason],
    ["Time", "Just now"],
  ]);
  pushTimeline("Attack Blocked", timelineText);
}

function acceptComment(comment) {
  state.comments.unshift(comment);
  state.unsafeBannerActive = state.comments.some((item) => item.kind === "malicious");
}

function proofCard(tag, tagType, details) {
  return { tag, tagType, details };
}

function pushTimeline(title, description) {
  state.timeline.unshift({ id: `timeline-${Date.now()}`, title, description, timeLabel: createTimestamp() });
  state.timeline = state.timeline.slice(0, 3);
}

function setConnectionStatus(tone, message) {
  state.connectionStatus = { tone, message };
}

function setFormFeedback(message, type) {
  state.formFeedback = message;
  state.formFeedbackType = type;
}

function clearFeedback() {
  state.formFeedback = "";
  state.formFeedbackType = "";
}

function buildRequestPreview(author, comment) {
  const route = state.connectionMode === "local" ? "/feedback/submit" : normalizeRoutePath(state.liveConfig.commentsRoute) || "/comments";
  return [
    `POST ${route}`,
    `Mode: ${state.connectionMode === "local" ? "local simulation" : "live gateway"}`,
    `Protection: ${state.protectionEnabled ? "ON" : "OFF"}`,
    `name=${author || "Visitor 1"}`,
    "",
    "comment=",
    comment || "(waiting for input)",
  ].join("\n");
}

function cloneSeededComments() {
  return seededComments.map((item) => ({ ...item }));
}

function currentAuthor() {
  return elements.nameInput.value.trim();
}

function currentComment() {
  return elements.commentInput.value.trim();
}

function mapLiveComment(comment, index) {
  return {
    id: comment.id || `live-comment-${index}`,
    author: comment.author || "Visitor",
    text: comment.text || "",
    timeLabel: comment.time_label || comment.timeLabel || "Just now",
    kind: comment.kind === "malicious" ? "malicious" : "safe",
  };
}

function looksLikeXssBlock(payload, malicious) {
  if (!malicious) {
    return false;
  }
  if (typeof payload === "string") {
    return /xss|script/i.test(payload);
  }
  if (typeof payload === "object" && payload) {
    const attackType = String(payload.attack_type || payload.type || "").toLowerCase();
    const reason = String(payload.reason || payload.message || "").toLowerCase();
    return attackType.includes("xss") || reason.includes("xss") || reason.includes("script");
  }
  return true;
}

function extractReason(payload, fallback) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (typeof payload === "object" && payload) {
    return payload.reason || payload.message || payload.proof || fallback;
  }
  return fallback;
}

function isSuspicious(text) {
  return suspiciousPatterns.some((pattern) => pattern.test(text));
}

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function createTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

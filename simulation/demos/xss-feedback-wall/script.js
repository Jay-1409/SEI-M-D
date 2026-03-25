const seededComments = [
  {
    id: "seed-1",
    author: "Riya",
    text: "Loved the robotics booth.",
    timeLabel: "2 min ago",
    kind: "safe",
  },
  {
    id: "seed-2",
    author: "Kabir",
    text: "The security project explanation was very clear.",
    timeLabel: "4 min ago",
    kind: "safe",
  },
  {
    id: "seed-3",
    author: "Neha",
    text: "Great event management and good demos.",
    timeLabel: "7 min ago",
    kind: "safe",
  },
];

const normalPreset = {
  author: "Aarav",
  text: "Great event. The project demos were easy to understand.",
};

const attackPreset = {
  author: "Attacker",
  text: "<script>document.getElementById('demo-banner').innerText='Page Manipulated';</script>",
};

const suspiciousPatterns = [/<script/i, /onerror\s*=/i, /onload\s*=/i, /javascript:/i];

const state = {
  protectionEnabled: false,
  comments: createInitialComments(),
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
};

const elements = {
  form: document.getElementById("comment-form"),
  toggle: document.getElementById("protection-toggle"),
  toggleStateText: document.getElementById("toggle-state-text"),
  modeHelper: document.getElementById("mode-helper"),
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
  timelineList: document.getElementById("timeline-list"),
};

initialize();

function initialize() {
  state.requestPreview = buildRequestPreview("Visitor 1", "");

  elements.toggle.addEventListener("change", handleToggleChange);
  elements.presetNormal.addEventListener("click", () => applyPreset(normalPreset));
  elements.presetAttack.addEventListener("click", () => applyPreset(attackPreset));
  elements.form.addEventListener("submit", handleSubmit);
  elements.resetButton.addEventListener("click", resetDemo);
  elements.nameInput.addEventListener("input", handleFormPreviewChange);
  elements.commentInput.addEventListener("input", handleFormPreviewChange);

  render();
}

function createInitialComments() {
  return seededComments.map((comment) => ({ ...comment }));
}

function handleToggleChange() {
  state.protectionEnabled = elements.toggle.checked;
  state.formFeedback = "";
  state.formFeedbackType = "";
  state.requestPreview = buildRequestPreview(elements.nameInput.value.trim(), elements.commentInput.value);
  render();
}

function handleFormPreviewChange() {
  state.requestPreview = buildRequestPreview(elements.nameInput.value.trim(), elements.commentInput.value);
  renderRequestPreview();
}

function applyPreset(preset) {
  elements.nameInput.value = preset.author;
  elements.commentInput.value = preset.text;
  state.formFeedback = "";
  state.formFeedbackType = "";
  state.requestPreview = buildRequestPreview(preset.author, preset.text);
  render();
}

async function handleSubmit(event) {
  event.preventDefault();

  const author = elements.nameInput.value.trim();
  const commentText = elements.commentInput.value.trim();

  if (!author || !commentText) {
    state.formFeedback = "Please enter both a name and a comment.";
    state.formFeedbackType = "error";
    render();
    return;
  }

  state.requestPreview = buildRequestPreview(author, commentText);
  elements.submitButton.disabled = true;
  elements.submitButton.textContent = "Posting...";
  renderRequestPreview();

  await wait(480);

  const malicious = isSuspicious(commentText);

  if (malicious && state.protectionEnabled) {
    state.blockCount += 1;
    state.statusType = "blocked";
    state.statusMessage = "Dangerous script content was detected and blocked before reaching the page.";
    state.lastAction = "XSS attempt blocked";
    state.formFeedback = "Comment rejected: dangerous script-like content is not allowed.";
    state.formFeedbackType = "error";
    state.eventProof = {
      tag: "Blocked XSS Event",
      tagType: "blocked",
      details: [
        ["Attack type", "XSS"],
        ["Route", "/feedback/submit"],
        ["Field", "comment"],
        ["Decision", "Blocked"],
        ["Reason", "Script-like content detected in comment field"],
        ["Time", "Just now"],
      ],
    };
    addTimelineEntry("Attack Blocked", "The gateway stopped a dangerous comment before it could reach the public wall.");
  } else if (malicious) {
    state.comments.unshift({
      id: `comment-${Date.now()}`,
      author,
      text: commentText,
      timeLabel: "Just now",
      kind: "malicious",
    });
    state.unsafeBannerActive = true;
    state.statusType = "warning";
    state.statusMessage = "Dangerous script-style content was accepted because protection is OFF.";
    state.lastAction = "Unsafe comment reached the page";
    state.formFeedback = "Dangerous content reached the page because protection is OFF.";
    state.formFeedbackType = "error";
    state.eventProof = {
      tag: "No gateway block occurred",
      tagType: "warning",
      details: [
        ["Attack type", "XSS-style comment"],
        ["Route", "/feedback/submit"],
        ["Field", "comment"],
        ["Decision", "Accepted"],
        ["Reason", "Protection was OFF"],
        ["Time", "Just now"],
      ],
    };
    addTimelineEntry("Warning", "A dangerous comment was accepted and the page warning changed to show the risk.");
  } else {
    state.comments.unshift({
      id: `comment-${Date.now()}`,
      author,
      text: commentText,
      timeLabel: "Just now",
      kind: "safe",
    });
    state.statusType = "safe";
    state.statusMessage = "Normal text comment accepted. No attack pattern detected.";
    state.lastAction = "Comment posted successfully";
    state.formFeedback = "Safe comment posted. No harmful script pattern found.";
    state.formFeedbackType = "success";
    state.eventProof = {
      tag: "Safe request",
      tagType: "safe",
      details: [
        ["Request type", "Normal comment"],
        ["Route", "/feedback/submit"],
        ["Field", "comment"],
        ["Decision", "Allowed"],
        ["Reason", "Plain text comment"],
        ["Time", "Just now"],
      ],
    };
    addTimelineEntry("Safe Activity", "A normal public comment was accepted and shown on the wall.");
  }

  elements.submitButton.disabled = false;
  elements.submitButton.textContent = "Post Comment";
  render();
}

function resetDemo() {
  state.protectionEnabled = false;
  state.comments = createInitialComments();
  state.blockCount = 0;
  state.statusType = "idle";
  state.statusMessage = "Choose a comment type and submit it to start the demo.";
  state.lastAction = "Waiting for first submission";
  state.formFeedback = "";
  state.formFeedbackType = "";
  state.unsafeBannerActive = false;
  state.eventProof = null;
  state.timeline = [];
  elements.toggle.checked = false;
  elements.nameInput.value = "Visitor 1";
  elements.commentInput.value = "";
  state.requestPreview = buildRequestPreview("Visitor 1", "");
  elements.submitButton.disabled = false;
  elements.submitButton.textContent = "Post Comment";
  render();
}

function isSuspicious(text) {
  return suspiciousPatterns.some((pattern) => pattern.test(text));
}

function addTimelineEntry(title, description) {
  state.timeline.unshift({
    id: `timeline-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    description,
    timeLabel: "Just now",
  });

  state.timeline = state.timeline.slice(0, 3);
}

function buildRequestPreview(author, commentText) {
  const safeAuthor = author || "Visitor 1";
  const previewText = commentText || "(waiting for input)";
  const modeLine = state.protectionEnabled ? "Protection: ON" : "Protection: OFF";

  return [
    "POST /feedback/submit",
    modeLine,
    `name=${safeAuthor}`,
    "",
    "comment=",
    previewText,
  ].join("\n");
}

function render() {
  renderMode();
  renderBanner();
  renderComments();
  renderStatus();
  renderEventProof();
  renderRequestPreview();
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

function renderBanner() {
  if (state.unsafeBannerActive) {
    elements.demoBanner.className = "demo-banner warning";
    elements.bannerMessage.textContent = "Warning: page content was modified by a dangerous comment";
    elements.sessionPill.textContent = "Visitor session at risk";
    elements.sessionPill.className = "session-pill risk";
  } else {
    elements.demoBanner.className = "demo-banner safe";
    elements.bannerMessage.textContent = "Feedback wall is showing normal public comments.";
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

    const content = document.createElement("div");
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

    content.append(meta, body);
    card.append(avatar, content);
    elements.commentList.append(card);
  });

  elements.commentCountLabel.textContent = `${state.comments.length} visible comments`;
}

function renderStatus() {
  const badgeMap = {
    idle: "Idle",
    safe: "Safe Activity",
    warning: "Warning",
    blocked: "Attack Blocked",
  };

  elements.statusBadge.textContent = badgeMap[state.statusType];
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
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    elements.eventProofDetails.append(dt, dd);
  });
}

function renderRequestPreview() {
  elements.requestPreview.textContent = state.requestPreview;
}

function renderTimeline() {
  elements.timelineList.innerHTML = "";

  if (!state.timeline.length) {
    const idleItem = document.createElement("div");
    idleItem.className = "timeline-item";
    const title = document.createElement("strong");
    title.textContent = "No actions yet";
    const text = document.createElement("p");
    text.textContent = "Use a preset and submit it to create visible proof for visitors.";
    idleItem.append(title, text);
    elements.timelineList.append(idleItem);
    return;
  }

  state.timeline.forEach((item) => {
    const row = document.createElement("div");
    row.className = "timeline-item";

    const title = document.createElement("strong");
    title.textContent = `${item.title} - ${item.timeLabel}`;

    const text = document.createElement("p");
    text.textContent = item.description;

    row.append(title, text);
    elements.timelineList.append(row);
  });
}

function renderFormFeedback() {
  elements.formFeedback.textContent = state.formFeedback;
  elements.formFeedback.className = state.formFeedbackType
    ? `form-feedback ${state.formFeedbackType}`
    : "form-feedback";
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

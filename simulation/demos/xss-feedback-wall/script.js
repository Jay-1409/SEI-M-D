const normalPreset = { author: "Aarav", text: "Great event. The project demos were easy to understand." };
const attackPreset = { author: "Attacker", text: "<script>document.getElementById('demo-banner').innerText='Page Manipulated';</script>" };

const elements = {
  urlInput: document.getElementById("urlInput"),
  nameInput: document.getElementById("nameInput"),
  commentInput: document.getElementById("commentInput"),
  presetNormal: document.getElementById("presetNormal"),
  presetAttack: document.getElementById("presetAttack"),
  submitButton: document.getElementById("submitButton"),
  statusIndicator: document.getElementById("statusIndicator"),
  form: document.getElementById("comment-form"),
};

function setStatus(status, message) {
  elements.statusIndicator.className = `status-indicator ${status}`;
  elements.statusIndicator.textContent = message;
}

elements.presetNormal.addEventListener("click", () => {
  elements.nameInput.value = normalPreset.author;
  elements.commentInput.value = normalPreset.text;
});

elements.presetAttack.addEventListener("click", () => {
  elements.nameInput.value = attackPreset.author;
  elements.commentInput.value = attackPreset.text;
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const url = elements.urlInput.value.trim();
  const author = elements.nameInput.value.trim() || "Visitor";
  const comment = elements.commentInput.value.trim();

  if (!url || !comment) {
    setStatus("error", "Please provide a target Gateway URL and a comment.");
    return;
  }

  elements.submitButton.disabled = true;
  elements.submitButton.textContent = "Posting...";
  setStatus("idle", "Sending request to gateway...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ author, comment }),
    });

    try {
      const payload = await response.json();

      let attackType = payload?.attack_type || payload?.type || "";
      let reason = payload?.reason || payload?.message || "";
      let isXssBlock = attackType.toLowerCase().includes("xss") || reason.toLowerCase().includes("xss") || reason.toLowerCase().includes("script");

      if (response.status === 403 && isXssBlock) {
        setStatus("error", `Blocked by Gateway WAF (XSS payload detected).`);
      } else if (response.ok && payload?.result === "accepted") {
        if (payload.comment_kind === "malicious") {
          setStatus("error", `Accepted: Gateway forwarded the suspicious comment! XSS Protection is OFF.`);
        } else {
          setStatus("success", `Accepted: Service received the comment normally.`);
        }
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
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "Post Comment";
  }
});

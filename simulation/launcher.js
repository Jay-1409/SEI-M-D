(function () {
  const envApi = window.SimulationGlobalEnv;
  if (!envApi) {
    return;
  }

  const elements = {
    form: document.getElementById("globalEnvForm"),
    serviceNameInput: document.getElementById("serviceNameInput"),
    resetServiceNameButton: document.getElementById("resetServiceNameButton"),
    configFeedback: document.getElementById("configFeedback"),
    previewSql: document.getElementById("previewSql"),
    previewXss: document.getElementById("previewXss"),
    previewRate: document.getElementById("previewRate"),
    previewApi: document.getElementById("previewApi"),
  };

  function setFeedback(message, tone) {
    if (!elements.configFeedback) {
      return;
    }
    elements.configFeedback.textContent = message;
    elements.configFeedback.className = `config-feedback ${tone || ""}`.trim();
  }

  function renderPreview(serviceName) {
    if (elements.previewSql) {
      elements.previewSql.textContent = envApi.buildServiceRoute(serviceName, "/login");
    }
    if (elements.previewXss) {
      elements.previewXss.textContent = envApi.buildServiceRoute(serviceName, "/comments");
    }
    if (elements.previewRate) {
      elements.previewRate.textContent = envApi.buildServiceRoute(serviceName, "/tickets");
    }
    if (elements.previewApi) {
      elements.previewApi.textContent = envApi.buildServiceRoute(serviceName, "/staff/open-maintenance-panel");
    }
  }

  function renderConfig() {
    const config = envApi.getConfig();
    if (elements.serviceNameInput) {
      elements.serviceNameInput.value = config.serviceName;
    }
    renderPreview(config.serviceName);
  }

  function saveConfig() {
    if (!elements.serviceNameInput) {
      return;
    }
    const saved = envApi.setConfig({
      serviceName: elements.serviceNameInput.value,
    });
    elements.serviceNameInput.value = saved.serviceName;
    renderPreview(saved.serviceName);
    setFeedback(`Saved. Active service name: ${saved.serviceName}`, "success");
  }

  if (elements.form) {
    elements.form.addEventListener("submit", function (event) {
      event.preventDefault();
      saveConfig();
    });
  }

  if (elements.serviceNameInput) {
    elements.serviceNameInput.addEventListener("blur", function () {
      saveConfig();
    });
  }

  if (elements.resetServiceNameButton) {
    elements.resetServiceNameButton.addEventListener("click", function () {
      const resetConfig = envApi.resetConfig();
      if (elements.serviceNameInput) {
        elements.serviceNameInput.value = resetConfig.serviceName;
      }
      renderPreview(resetConfig.serviceName);
      setFeedback(`Reset to default: ${resetConfig.serviceName}`, "neutral");
    });
  }

  renderConfig();
})();

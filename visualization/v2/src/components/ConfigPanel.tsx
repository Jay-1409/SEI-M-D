import { useStore } from '../state/store';
import { SERVICE_PRESETS, ATTACK_PRESETS } from '../state/presets';
import type { ServicePreset, LayerType, WafSensitivity, HealthStatus, DeployOutcome } from '../state/types';
import { runDeployPipeline } from '../simulation/engine';

export default function ConfigPanel() {
  const services = useStore(s => s.services);
  const ui = useStore(s => s.ui);
  const gateway = useStore(s => s.gateway);
  const deployPipeline = useStore(s => s.deployPipeline);
  const addService = useStore(s => s.addService);
  const removeService = useStore(s => s.removeService);
  const updateService = useStore(s => s.updateService);
  const updateGateway = useStore(s => s.updateGateway);
  const reorderLayers = useStore(s => s.reorderLayers);
  const setUI = useStore(s => s.setUI);
  const setDeployPipeline = useStore(s => s.setDeployPipeline);

  const svc = services.find(x => x.id === ui.selectedServiceId);

  const LAYER_NAMES: Record<LayerType, string> = { waf: '🛡 WAF', rateLimit: '⏱ Rate Limit', apiKeyAuth: '🔑 API Key' };
  const moveLayer = (idx: number, dir: -1 | 1) => {
    const o = [...gateway.layerOrder];
    const n = idx + dir;
    if (n < 0 || n >= o.length) return;
    [o[idx], o[n]] = [o[n], o[idx]];
    reorderLayers(o);
  };
  const toggleLayer = (layer: LayerType) => {
    const enabled = gateway.enabledLayers.includes(layer)
      ? gateway.enabledLayers.filter(l => l !== layer)
      : [...gateway.enabledLayers, layer];
    updateGateway({ enabledLayers: enabled });
  };

  const handleDeploy = async (serviceId: string) => {
    if (deployPipeline.active) return;
    await runDeployPipeline(serviceId);
  };

  return (
    <aside className="config-panel">
      {/* Service Catalog */}
      <div className="cp-section">
        <div className="cp-title">📦 Services</div>
        <div className="catalog-grid">
          {SERVICE_PRESETS.map(p => (
            <button key={p.name} className="cat-btn" onClick={() => addService(p)}
              style={{ '--c': p.color } as React.CSSProperties}>
              <span className="cat-icon">{p.icon}</span>
              <span className="cat-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deployed services */}
      {services.length > 0 && (
        <div className="cp-section">
          <div className="cp-title">☸️ In Cluster <span className="cp-count">{services.length}</span></div>
          <div className="svc-list">
            {services.map(s => (
              <div key={s.id}
                className={`svc-item ${ui.selectedServiceId === s.id ? 'selected' : ''} ${s.deployed ? '' : 'pending'}`}
                style={{ '--c': s.color } as React.CSSProperties}
                onClick={() => setUI({ selectedServiceId: s.id })}>
                <span className="svc-icon">{s.icon}</span>
                <div className="svc-info">
                  <span className="svc-name">{s.name}</span>
                  <span className="svc-route">{s.routePrefix} · :{s.port}</span>
                </div>
                <span className={`svc-status ${s.deployed ? 'live' : ''}`}>
                  {s.deployed ? '●' : '○'}
                </span>
                <button className="svc-x" onClick={e => { e.stopPropagation(); removeService(s.id); }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected service config */}
      {svc && (
        <div className="cp-section config-section">
          <div className="cp-title">{svc.icon} Configure</div>
          <div className="cfg-form">
            <label className="cfg-label">Name</label>
            <input className="cfg-input" value={svc.name} onChange={e => updateService(svc.id, { name: e.target.value })} />

            <label className="cfg-label">Route Prefix</label>
            <input className="cfg-input" value={svc.routePrefix} onChange={e => updateService(svc.id, { routePrefix: e.target.value })} />

            <div className="cfg-row">
              <div>
                <label className="cfg-label">Port</label>
                <input className="cfg-input" type="number" value={svc.port} onChange={e => updateService(svc.id, { port: +e.target.value })} />
              </div>
              <div>
                <label className="cfg-label">Replicas</label>
                <input className="cfg-input" type="number" min={1} max={10} value={svc.replicas} onChange={e => updateService(svc.id, { replicas: +e.target.value })} />
              </div>
            </div>

            <label className="cfg-label">WAF Sensitivity</label>
            <select className="cfg-input" value={svc.policies.wafSensitivity}
              onChange={e => updateService(svc.id, { policies: { ...svc.policies, wafSensitivity: e.target.value as WafSensitivity } })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>

            <label className="cfg-label">Rate Limit (req/min)</label>
            <input className="cfg-input" type="number" value={svc.policies.rateLimit}
              onChange={e => updateService(svc.id, { policies: { ...svc.policies, rateLimit: +e.target.value } })} />

            <div className="cfg-toggle-row">
              <span>Require API Key</span>
              <label className="toggle-s">
                <input type="checkbox" checked={svc.policies.requireApiKey}
                  onChange={e => updateService(svc.id, { policies: { ...svc.policies, requireApiKey: e.target.checked } })} />
                <span className="toggle-s-track" />
              </label>
            </div>

            <label className="cfg-label">Health Status</label>
            <select className="cfg-input" value={svc.health}
              onChange={e => updateService(svc.id, { health: e.target.value as HealthStatus })}>
              <option value="healthy">✅ Healthy</option><option value="degraded">⚠️ Degraded</option><option value="down">❌ Down</option>
            </select>

            {!svc.deployed && (
              <div className="deploy-box">
                <label className="cfg-label">Deploy Outcome (demo)</label>
                <select className="cfg-input" value={deployPipeline.outcome}
                  onChange={e => setDeployPipeline({ outcome: e.target.value as DeployOutcome })}>
                  <option value="clean">✅ Clean Image</option>
                  <option value="vulnerable">🚨 Vulnerable Image</option>
                  <option value="misconfigured">⚠️ Misconfigured Endpoint</option>
                </select>
                <button className="deploy-btn" onClick={() => handleDeploy(svc.id)} disabled={deployPipeline.active}>
                  {deployPipeline.active ? '⏳ Deploying...' : '🚀 Deploy Service'}
                </button>
              </div>
            )}

            {svc.deployed && (
              <div className="cfg-deployed-badge">🔒 ClusterIP · Internal Only</div>
            )}
          </div>
        </div>
      )}

      {/* Gateway config */}
      <div className="cp-section">
        <div className="cp-title">🛡️ Gateway <span className="cp-sub">:{gateway.port}</span></div>
        <div className="layer-list">
          {gateway.layerOrder.map((layer, idx) => (
            <div key={layer} className={`layer-row ${gateway.enabledLayers.includes(layer) ? '' : 'off'}`}>
              <span className="layer-num">{idx + 1}</span>
              <span className="layer-name">{LAYER_NAMES[layer]}</span>
              <button className="layer-mv" onClick={() => moveLayer(idx, -1)} disabled={idx === 0}>↑</button>
              <button className="layer-mv" onClick={() => moveLayer(idx, 1)} disabled={idx === gateway.layerOrder.length - 1}>↓</button>
              <label className="toggle-s">
                <input type="checkbox" checked={gateway.enabledLayers.includes(layer)} onChange={() => toggleLayer(layer)} />
                <span className="toggle-s-track" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

import { useStore } from '../state/store';
import type { LayerType } from '../state/types';

const INITIAL_DEPLOY = {
  active: false, serviceId: null, stage: 'idle' as const,
  trivy: { status: 'idle' as const, critical: 0, high: 0, medium: 0, low: 0, findings: [] },
  nikto: { status: 'idle' as const, issueCount: 0, findings: [] },
  policyPassed: null, policyReason: '', outcome: 'clean' as const,
};

const LAYER_INFO: Record<LayerType, { icon: string; name: string }> = {
  waf: { icon: '🛡', name: 'WAF' },
  rateLimit: { icon: '⏱', name: 'Rate Limit' },
  apiKeyAuth: { icon: '🔑', name: 'API Key' },
};

const DEPLOY_STAGES = [
  { key: 'build', icon: '🔨', label: 'Build' },
  { key: 'trivy', icon: '🔍', label: 'Trivy' },
  { key: 'nikto', icon: '🕷', label: 'Nikto' },
  { key: 'policyGate', icon: '🚦', label: 'Policy' },
  { key: 'deploy', icon: '🚀', label: 'Deploy' },
];

export default function Canvas() {
  const services = useStore(s => s.services);
  const gateway = useStore(s => s.gateway);
  const simulation = useStore(s => s.simulation);
  const deployPipeline = useStore(s => s.deployPipeline);
  const setDeployPipeline = useStore(s => s.setDeployPipeline);
  const setUI = useStore(s => s.setUI);

  const showInfo = (key: string) => setUI({ infoPanelKey: key });
  const deployedServices = services.filter(s => s.deployed);
  const targetSvc = services.find(s => s.id === simulation.targetServiceId) || deployedServices[0];

  // Determine arrow states
  const isAttack = simulation.trafficType === 'attack' && simulation.isPlaying;
  const isBlocked = simulation.resultType === 'blocked';
  const isSuccess = simulation.resultType === 'success';

  const lc = (s: string) => {
    if (s === 'checking') return 'lc-amber';
    if (s === 'passed') return 'lc-green';
    if (s === 'blocked') return 'lc-red';
    return '';
  };

  return (
    <div className="canvas">
      {/* Deploy pipeline (shown when active) */}
      {deployPipeline.active && (
        <div className="deploy-strip">
          <div className="deploy-strip-header">
          <span className="deploy-strip-title">⚙️ Deploy Pipeline</span>
          {(deployPipeline.stage === 'done' || deployPipeline.stage === 'blocked') && (
            <button className="deploy-strip-close" onClick={() => setDeployPipeline(INITIAL_DEPLOY)}>✕ Dismiss</button>
          )}
        </div>
          <div className="deploy-stages">
            {DEPLOY_STAGES.map(stg => {
              let cls = '';
              const cur = deployPipeline.stage;
              const stageOrder = ['build', 'trivy', 'nikto', 'policyGate', 'deploy'];
              const curIdx = stageOrder.indexOf(cur);
              const stgIdx = stageOrder.indexOf(stg.key);
              if (cur === 'blocked' && stg.key === 'policyGate') cls = 'ds-red';
              else if (cur === 'blocked' && stgIdx > 3) cls = 'ds-dim';
              else if (stgIdx < curIdx) cls = 'ds-green';
              else if (stgIdx === curIdx) cls = 'ds-active';
              else cls = 'ds-dim';
              return (
                <div key={stg.key} className={`ds-node ${cls}`} onClick={() => showInfo(stg.key === 'policyGate' ? 'policyGate' : stg.key)}>
                  <span className="ds-icon">{stg.icon}</span>
                  <span className="ds-label">{stg.label}</span>
                  {cls === 'ds-green' && <span className="ds-check">✓</span>}
                  {cls === 'ds-red' && <span className="ds-check">✕</span>}
                </div>
              );
            })}
          </div>
          {/* Scan summaries */}
          {deployPipeline.trivy.status !== 'idle' && (
            <div className={`scan-chip ${deployPipeline.trivy.status === 'failed' ? 'sc-red' : deployPipeline.trivy.status === 'scanning' ? 'sc-amber' : 'sc-green'}`}>
              🔍 Trivy: {deployPipeline.trivy.status === 'scanning' ? 'Scanning...' : `${deployPipeline.trivy.critical}C / ${deployPipeline.trivy.high}H / ${deployPipeline.trivy.medium}M`}
            </div>
          )}
          {deployPipeline.nikto.status !== 'idle' && (
            <div className={`scan-chip ${deployPipeline.nikto.status === 'failed' ? 'sc-red' : deployPipeline.nikto.status === 'scanning' ? 'sc-amber' : 'sc-green'}`}>
              🕷 Nikto: {deployPipeline.nikto.status === 'scanning' ? 'Scanning...' : `${deployPipeline.nikto.issueCount} issues`}
            </div>
          )}
          {deployPipeline.policyPassed !== null && (
            <div className={`scan-chip ${deployPipeline.policyPassed ? 'sc-green' : 'sc-red'}`}>
              🚦 {deployPipeline.policyPassed ? 'DEPLOY APPROVED' : 'DEPLOY BLOCKED'}: {deployPipeline.policyReason}
            </div>
          )}
        </div>
      )}

      {/* Main architecture visualization */}
      <div className="arch-flow">
        {/* Internet */}
        <div className={`anode ${simulation.stage === 'sending' ? (isAttack ? 'an-red' : 'an-blue') : ''}`}
          onClick={() => showInfo('gateway')}>
          <div className="anode-circle">🌐</div>
          <div className="anode-label">Internet</div>
          {simulation.stage !== 'idle' && simulation.trafficType === 'attack' && (
            <div className="anode-chip ac-red">{useStore.getState().simulation.selectedAttack.toUpperCase()}</div>
          )}
          {simulation.stage !== 'idle' && simulation.trafficType === 'normal' && targetSvc && (
            <div className="anode-chip ac-blue">GET {targetSvc.routePrefix}</div>
          )}
        </div>

        <div className={`aedge ${simulation.stage !== 'idle' && simulation.stage !== 'done' ? (isAttack ? 'ae-red' : 'ae-blue') : ''}`}>
          <div className="ae-line" /><div className="ae-arrow" />
        </div>

        {/* Gateway */}
        <div className={`anode ${isBlocked ? 'an-red' : isSuccess ? 'an-green' : simulation.stage === 'gateway' || simulation.stage === 'layers' ? 'an-amber' : ''}`}
          onClick={() => showInfo('gateway')}>
          <div className="anode-circle">🛡️</div>
          <div className="anode-label">Gateway</div>
          <div className="anode-sub">:{gateway.port}</div>
        </div>

        <div className={`aedge ${simulation.stage === 'layers' || simulation.stage === 'routing' ? (isAttack ? 'ae-red' : 'ae-blue') : ''}`}>
          <div className="ae-line" /><div className="ae-arrow" />
        </div>

        {/* Security layers */}
        <div className="sec-column">
          {gateway.layerOrder.map(layer => {
            if (!gateway.enabledLayers.includes(layer)) return null;
            const info = LAYER_INFO[layer];
            const st = simulation.layerStates[layer];
            return (
              <div key={layer} className={`sec-chip ${lc(st)}`} onClick={() => showInfo(layer)}>
                <span className="sec-dot" />
                <span>{info.icon} {info.name}</span>
                {st === 'passed' && <span className="sec-mark">✓</span>}
                {st === 'blocked' && <span className="sec-mark sec-x">✕</span>}
              </div>
            );
          })}
        </div>

        <div className={`aedge ${simulation.stage === 'routing' || simulation.stage === 'response' ? 'ae-blue' : isBlocked ? 'ae-blocked' : ''}`}>
          <div className="ae-line" /><div className="ae-arrow" />
          {isBlocked && <div className="block-x">❌</div>}
        </div>

        {/* Cluster */}
        <div className="cluster-box" onClick={() => showInfo('cluster')}>
          <div className="cb-label">☸️ Cluster <span className="cb-badge">ClusterIP</span></div>
          {deployedServices.length === 0 && !deployPipeline.active && (
            <div className="cb-empty">No services deployed yet</div>
          )}
          <div className="cb-grid">
            {deployedServices.map(s => (
              <div key={s.id}
                className={`cb-svc ${s.id === targetSvc?.id && isSuccess ? 'cb-glow-green' : ''} ${s.id === targetSvc?.id && isBlocked ? 'cb-safe' : ''}`}
                style={{ borderLeftColor: s.color }}>
                <span>{s.icon}</span>
                <div>
                  <div className="cb-svc-name">{s.name}</div>
                  <div className="cb-svc-route">{s.routePrefix}</div>
                </div>
                {s.id === targetSvc?.id && isBlocked && <span className="cb-shield">🛡</span>}
                {s.id === targetSvc?.id && isSuccess && <span className="cb-ok">200</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result banner */}
      {simulation.resultText && (
        <div className={`result-bar ${simulation.resultType === 'success' ? 'rb-green' : 'rb-red'}`}>
          {simulation.resultText}
        </div>
      )}
    </div>
  );
}

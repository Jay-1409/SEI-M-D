// ============================================================
// Simulation Engine — Deploy + Traffic flows
// ============================================================
import { useStore } from '../state/store';
import type { Service, AttackPreset, LayerType } from '../state/types';
import { TRIVY_CLEAN, TRIVY_VULNERABLE, NIKTO_CLEAN, NIKTO_MISCONFIGURED } from '../state/presets';

function sleep(ms: number): Promise<void> {
  const speed = useStore.getState().simulation.speed;
  return new Promise(r => setTimeout(r, ms * speed));
}

const store = () => useStore.getState();

// ================================================================
// DEPLOY PIPELINE
// ================================================================
export async function runDeployPipeline(serviceId: string): Promise<void> {
  const s = store();
  const svc = s.services.find(x => x.id === serviceId);
  if (!svc) return;

  const outcome = s.deployPipeline.outcome;
  s.setDeployPipeline({ active: true, serviceId, stage: 'build' });
  s.addEvent('🔨', `Building ${svc.icon} ${svc.name} image...`, 'info');
  await sleep(800);

  // Trivy scan
  s.setDeployPipeline({ stage: 'trivy', trivy: { ...TRIVY_CLEAN, status: 'scanning' } });
  s.addEvent('🔍', 'Trivy: scanning image for CVEs...', 'info');
  await sleep(1200);

  const trivyResult = outcome === 'vulnerable' ? { ...TRIVY_VULNERABLE } : { ...TRIVY_CLEAN };
  store().setDeployPipeline({ trivy: trivyResult });

  if (trivyResult.status === 'passed') {
    store().addEvent('✅', `Trivy: ${trivyResult.critical}C/${trivyResult.high}H/${trivyResult.medium}M — PASSED`, 'success');
  } else {
    store().addEvent('🚨', `Trivy: ${trivyResult.critical} CRITICAL, ${trivyResult.high} HIGH — FAILED`, 'error');
  }
  await sleep(600);

  // Nikto scan
  store().setDeployPipeline({ stage: 'nikto', nikto: { ...NIKTO_CLEAN, status: 'scanning' } });
  store().addEvent('🕷', 'Nikto: testing endpoint configuration...', 'info');
  await sleep(1000);

  const niktoResult = outcome === 'misconfigured' ? { ...NIKTO_MISCONFIGURED } : { ...NIKTO_CLEAN };
  store().setDeployPipeline({ nikto: niktoResult });

  if (niktoResult.status === 'passed') {
    store().addEvent('✅', `Nikto: ${niktoResult.issueCount} minor issue(s) — PASSED`, 'success');
  } else {
    store().addEvent('🚨', `Nikto: ${niktoResult.issueCount} issues found — FAILED`, 'error');
  }
  await sleep(600);

  // Policy gate
  store().setDeployPipeline({ stage: 'policyGate' });
  store().addEvent('🚦', 'Policy gate evaluating scan results...', 'info');
  await sleep(800);

  const passed = trivyResult.status === 'passed' && niktoResult.status === 'passed';
  const reason = !passed
    ? (trivyResult.status === 'failed' ? `${trivyResult.critical} critical CVEs exceed threshold` : `${niktoResult.issueCount} Nikto issues exceed threshold`)
    : 'All scans within acceptable thresholds';

  store().setDeployPipeline({ policyPassed: passed, policyReason: reason });

  if (passed) {
    store().addEvent('🟢', `Policy gate: PASSED — ${reason}`, 'success');
  } else {
    store().addEvent('🔴', `Policy gate: BLOCKED — ${reason}`, 'error');
  }
  await sleep(500);

  if (!passed) {
    store().setDeployPipeline({ stage: 'blocked' });
    store().addEvent('⛔', `${svc.name} deployment BLOCKED — fix issues and retry`, 'error');
    await sleep(300);
    store().setDeployPipeline({ active: false });
    return;
  }

  // Deploy to cluster
  store().setDeployPipeline({ stage: 'deploy' });
  store().addEvent('🚀', `Deploying ${svc.name} to cluster...`, 'info');
  await sleep(800);

  store().updateService(serviceId, { deployed: true });
  store().setDeployPipeline({ stage: 'done' });
  store().addEvent('✅', `${svc.icon} ${svc.name} deployed — ClusterIP, internal only`, 'success');
}

// ================================================================
// NORMAL TRAFFIC SIMULATION
// ================================================================
export async function runNormalTraffic(target: Service): Promise<void> {
  const gw = store().gateway;

  store().setSimulation({ isPlaying: true, stage: 'sending', resultType: 'none', resultText: '' });
  store().setSimulation({ layerStates: { waf: 'idle', rateLimit: 'idle', apiKeyAuth: 'idle' } });
  store().addEvent('🌐', `Request: GET ${target.routePrefix}/list`, 'info');
  await sleep(500);

  store().setSimulation({ stage: 'gateway' });
  store().addEvent('🛡️', 'Gateway received request, starting security checks', 'info');
  await sleep(400);

  store().setSimulation({ stage: 'layers' });
  for (const layer of gw.layerOrder) {
    if (!gw.enabledLayers.includes(layer)) continue;
    setLayer(layer, 'checking');
    await sleep(600);
    setLayer(layer, 'passed');
    const name = layer === 'waf' ? 'WAF' : layer === 'rateLimit' ? 'Rate Limiter' : 'API Key Auth';
    store().addEvent('✓', `${name}: PASS`, 'success');
    await sleep(250);
  }

  store().setSimulation({ stage: 'routing' });
  store().addEvent('➡️', `Routing to ${target.name} (${target.routePrefix})`, 'info');
  await sleep(500);

  store().setSimulation({ stage: 'response' });
  await sleep(400);

  store().setSimulation({
    stage: 'done', resultType: 'success',
    resultText: `✅ 200 OK — ${target.name} responded successfully`,
    isPlaying: false,
  });
  store().addEvent('✅', `Response: 200 OK from ${target.name}`, 'success');
}

// ================================================================
// ATTACK TRAFFIC SIMULATION
// ================================================================
export async function runAttackTraffic(target: Service, attack: AttackPreset): Promise<void> {
  const gw = store().gateway;

  store().setSimulation({
    isPlaying: true, stage: 'sending', resultType: 'none', resultText: '',
    selectedAttack: attack.id,
    layerStates: { waf: 'idle', rateLimit: 'idle', apiKeyAuth: 'idle' },
  });
  store().addEvent('🔴', `Attack: ${attack.icon} ${attack.name} — ${attack.payload}`, 'error');
  await sleep(500);

  store().setSimulation({ stage: 'gateway' });
  store().addEvent('🛡️', 'Gateway inspecting request...', 'warning');
  await sleep(400);

  store().setSimulation({ stage: 'layers' });

  for (const layer of gw.layerOrder) {
    if (!gw.enabledLayers.includes(layer)) continue;
    setLayer(layer, 'checking');
    await sleep(700);

    if (layer === attack.blockedBy) {
      setLayer(layer, 'blocked');
      const name = layer === 'waf' ? 'WAF' : layer === 'rateLimit' ? 'Rate Limiter' : 'API Key Auth';
      store().addEvent('🚨', `${name}: BLOCKED — ${attack.reason}`, 'error');
      await sleep(400);
      break;
    } else {
      setLayer(layer, 'passed');
      const name = layer === 'waf' ? 'WAF' : layer === 'rateLimit' ? 'Rate Limiter' : 'API Key Auth';
      store().addEvent('✓', `${name}: PASS`, 'success');
      await sleep(250);
    }
  }

  // Check if blocking layer is disabled
  if (!gw.enabledLayers.includes(attack.blockedBy)) {
    store().setSimulation({ stage: 'routing' });
    await sleep(400);
    store().setSimulation({
      stage: 'done', resultType: 'success',
      resultText: `⚠️ Attack reached ${target.name}! ${attack.blockedBy} layer is DISABLED`,
      isPlaying: false,
    });
    store().addEvent('⚠️', `DANGER: ${attack.name} reached service — enable ${attack.blockedBy}!`, 'error');
    return;
  }

  await sleep(300);
  store().setSimulation({
    stage: 'done', resultType: 'blocked',
    resultText: `🚨 ${attack.name} BLOCKED — ${target.name} was NEVER reached`,
    isPlaying: false,
  });
  store().addEvent('🛡', `${target.name} protected — attack never reached service`, 'success');
}

// Helper
function setLayer(layer: LayerType, state: 'idle' | 'checking' | 'passed' | 'blocked') {
  const current = store().simulation.layerStates;
  store().setSimulation({ layerStates: { ...current, [layer]: state } });
}

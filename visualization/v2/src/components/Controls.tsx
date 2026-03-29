import { useStore } from '../state/store';
import { ATTACK_PRESETS } from '../state/presets';
import type { SimSpeed } from '../state/types';
import { runNormalTraffic, runAttackTraffic } from '../simulation/engine';

export default function Controls() {
  const simulation = useStore(s => s.simulation);
  const services = useStore(s => s.services);
  const setSimulation = useStore(s => s.setSimulation);
  const resetAll = useStore(s => s.resetAll);
  const exportScenario = useStore(s => s.exportScenario);
  const importScenario = useStore(s => s.importScenario);

  const deployedServices = services.filter(s => s.deployed);
  const target = services.find(s => s.id === simulation.targetServiceId) || deployedServices[0];

  const resetSim = () => {
    setSimulation({
      isPlaying: false, stage: 'idle', resultType: 'none', resultText: '',
      layerStates: { waf: 'idle', rateLimit: 'idle', apiKeyAuth: 'idle' },
    });
  };

  const handlePlay = async () => {
    if (simulation.isPlaying || !target) return;
    resetSim();
    await new Promise(r => setTimeout(r, 100));
    if (simulation.trafficType === 'normal') {
      await runNormalTraffic(target);
    } else {
      const atk = ATTACK_PRESETS.find(a => a.id === simulation.selectedAttack) || ATTACK_PRESETS[0];
      await runAttackTraffic(target, atk);
    }
    // Auto-loop
    if (useStore.getState().simulation.loop) {
      setTimeout(async () => { resetSim(); setTimeout(() => handlePlay(), 500); }, 2000 * simulation.speed);
    }
  };

  const handleExport = () => {
    const json = exportScenario();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'expo-scenario.json';
    a.click();
  };
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => importScenario(r.result as string);
      r.readAsText(f);
    };
    input.click();
  };

  return (
    <header className="top-bar">
      <h1 className="tb-title">🛡️ Secure Microservice Deployer</h1>

      <div className="tb-controls">
        <button className="tb-btn tb-primary" onClick={handlePlay} disabled={simulation.isPlaying || deployedServices.length === 0}>
          {simulation.isPlaying ? '⏳ Running...' : '▶ Play'}
        </button>
        <button className="tb-btn" onClick={resetSim}>↻ Reset</button>

        <span className="tb-sep" />

        <button className={`tb-btn ${simulation.trafficType === 'normal' ? 'tb-green' : ''}`}
          onClick={() => { resetSim(); setSimulation({ trafficType: 'normal' }); }}>
          🟢 Normal
        </button>
        <button className={`tb-btn ${simulation.trafficType === 'attack' ? 'tb-red' : ''}`}
          onClick={() => { resetSim(); setSimulation({ trafficType: 'attack' }); }}>
          🔴 Attack
        </button>

        {simulation.trafficType === 'attack' && (
          <select className="tb-select" value={simulation.selectedAttack}
            onChange={e => setSimulation({ selectedAttack: e.target.value })}>
            {ATTACK_PRESETS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
          </select>
        )}

        {deployedServices.length > 1 && (
          <select className="tb-select" value={simulation.targetServiceId || ''}
            onChange={e => setSimulation({ targetServiceId: e.target.value })}>
            {deployedServices.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        )}

        <span className="tb-sep" />

        <div className="speed-group">
          {([0.5, 1, 2] as SimSpeed[]).map(sp => (
            <button key={sp} className={`tb-btn tb-sm ${simulation.speed === sp ? 'tb-active' : ''}`}
              onClick={() => setSimulation({ speed: sp })}>
              {sp === 0.5 ? '🐢' : sp === 1 ? '1x' : '⚡'}
            </button>
          ))}
        </div>
        <button className={`tb-btn tb-sm ${simulation.loop ? 'tb-active' : ''}`}
          onClick={() => setSimulation({ loop: !simulation.loop })}>🔁</button>

        <span className="tb-sep" />

        <button className="tb-btn tb-sm" onClick={handleExport}>💾</button>
        <button className="tb-btn tb-sm" onClick={handleImport}>📂</button>
        <button className="tb-btn tb-sm tb-danger" onClick={resetAll}>🗑</button>
      </div>
    </header>
  );
}

import { create } from 'zustand';
import type { AppState, Service, ServicePreset, LayerType, TimelineEvent, DeployPipeline } from './types';
import { DEFAULT_POLICIES } from './presets';

let idCounter = 0;
function genId() { return 'svc-' + (++idCounter) + '-' + Date.now().toString(36); }
let evtCounter = 0;
function evtId() { return 'e-' + (++evtCounter); }
function now() { return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

const EMPTY_DEPLOY: DeployPipeline = {
  active: false, serviceId: null,
  stage: 'idle',
  trivy: { status: 'idle', critical: 0, high: 0, medium: 0, low: 0, findings: [] },
  nikto: { status: 'idle', issueCount: 0, findings: [] },
  policyPassed: null, policyReason: '', outcome: 'clean',
};

const INITIAL: Omit<AppState, 'addService' | 'removeService' | 'updateService' | 'updateGateway' | 'reorderLayers' | 'setSimulation' | 'setDeployPipeline' | 'setUI' | 'addEvent' | 'clearTimeline' | 'resetAll' | 'exportScenario' | 'importScenario'> = {
  services: [],
  deployPipeline: { ...EMPTY_DEPLOY },
  gateway: {
    port: 30080,
    enabledLayers: ['waf', 'rateLimit', 'apiKeyAuth'],
    layerOrder: ['waf', 'rateLimit', 'apiKeyAuth'],
    globalPolicies: { ...DEFAULT_POLICIES },
  },
  simulation: {
    isPlaying: false, speed: 1, loop: false,
    trafficType: 'normal', selectedAttack: 'sqli', targetServiceId: null,
    layerStates: { waf: 'idle', rateLimit: 'idle', apiKeyAuth: 'idle' },
    stage: 'idle', resultType: 'none', resultText: '',
  },
  timeline: [],
  ui: { selectedServiceId: null, configPanelOpen: false, infoPanelKey: null, showOnboarding: true },
};

export const useStore = create<AppState>((set, get) => ({
  ...INITIAL,

  addService: (preset: ServicePreset) => {
    const s = get();
    if (s.services.length >= 9) return;
    const svc: Service = {
      id: genId(), name: preset.name, icon: preset.icon,
      routePrefix: preset.routePrefix, port: preset.port,
      replicas: 1, policies: { ...preset.defaultPolicies },
      health: 'healthy', deployed: false, color: preset.color,
    };
    set({ services: [...s.services, svc] });
    get().addEvent('📦', `${preset.icon} ${preset.name} added to cluster`, 'info');
  },

  removeService: (id) => set((s) => {
    const svc = s.services.find(x => x.id === id);
    return {
      services: s.services.filter(x => x.id !== id),
      ui: s.ui.selectedServiceId === id ? { ...s.ui, selectedServiceId: null, configPanelOpen: false } : s.ui,
      timeline: [...s.timeline, { id: evtId(), time: now(), icon: '🗑', text: `${svc?.name || 'Service'} removed`, type: 'warning' }],
    };
  }),

  updateService: (id, updates) => set((s) => ({
    services: s.services.map(svc => svc.id === id ? { ...svc, ...updates } : svc),
  })),

  updateGateway: (updates) => set((s) => ({ gateway: { ...s.gateway, ...updates } })),

  reorderLayers: (newOrder) => set((s) => ({ gateway: { ...s.gateway, layerOrder: newOrder } })),

  setSimulation: (updates) => set((s) => ({ simulation: { ...s.simulation, ...updates } })),

  setDeployPipeline: (updates) => set((s) => ({ deployPipeline: { ...s.deployPipeline, ...updates } })),

  setUI: (updates) => set((s) => ({ ui: { ...s.ui, ...updates } })),

  addEvent: (icon, text, type) => set((s) => ({
    timeline: [...s.timeline, { id: evtId(), time: now(), icon, text, type }],
  })),

  clearTimeline: () => set({ timeline: [] }),

  resetAll: () => {
    idCounter = 0; evtCounter = 0;
    set({
      ...INITIAL,
      deployPipeline: { ...EMPTY_DEPLOY },
      simulation: { ...INITIAL.simulation, layerStates: { waf: 'idle', rateLimit: 'idle', apiKeyAuth: 'idle' } },
      timeline: [{ id: evtId(), time: now(), icon: '🔄', text: 'System reset to default', type: 'info' }],
      ui: { ...INITIAL.ui },
    });
  },

  exportScenario: () => {
    const s = get();
    return JSON.stringify({ services: s.services, gateway: s.gateway, timeline: s.timeline }, null, 2);
  },

  importScenario: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.services && data.gateway) {
        set({ services: data.services, gateway: data.gateway });
        get().addEvent('📂', 'Scenario imported', 'info');
        return true;
      }
      return false;
    } catch { return false; }
  },
}));

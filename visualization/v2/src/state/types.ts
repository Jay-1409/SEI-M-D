// ============================================================
// State types for Unified Single-Page Expo Demo
// ============================================================

export type LayerType = 'waf' | 'rateLimit' | 'apiKeyAuth';
export type HealthStatus = 'healthy' | 'degraded' | 'down';
export type WafSensitivity = 'low' | 'medium' | 'high';
export type DeploySpeed = 'slow' | 'normal' | 'fast';
export type SimSpeed = 0.5 | 1 | 2;

// ---- Service ----
export interface Policies {
  requireApiKey: boolean;
  rateLimit: number;
  wafSensitivity: WafSensitivity;
  allowedMethods: string[];
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  routePrefix: string;
  port: number;
  replicas: number;
  policies: Policies;
  health: HealthStatus;
  deployed: boolean;
  color: string;
}

// ---- Deploy Pipeline ----
export type ScanStatus = 'idle' | 'scanning' | 'passed' | 'failed';

export interface ScanFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface TrivyResult {
  status: ScanStatus;
  critical: number;
  high: number;
  medium: number;
  low: number;
  findings: ScanFinding[];
}

export interface NiktoResult {
  status: ScanStatus;
  issueCount: number;
  findings: ScanFinding[];
}

export type DeployOutcome = 'clean' | 'vulnerable' | 'misconfigured';

export interface DeployPipeline {
  active: boolean;
  serviceId: string | null;
  stage: 'idle' | 'build' | 'trivy' | 'nikto' | 'policyGate' | 'deploy' | 'done' | 'blocked';
  trivy: TrivyResult;
  nikto: NiktoResult;
  policyPassed: boolean | null;
  policyReason: string;
  outcome: DeployOutcome;
}

// ---- Gateway ----
export interface GatewayConfig {
  port: number;
  enabledLayers: LayerType[];
  layerOrder: LayerType[];
  globalPolicies: Policies;
}

// ---- Simulation ----
export type TrafficType = 'normal' | 'attack';

export interface SimulationState {
  isPlaying: boolean;
  speed: SimSpeed;
  loop: boolean;
  trafficType: TrafficType;
  selectedAttack: string;
  targetServiceId: string | null;
  layerStates: Record<LayerType, 'idle' | 'checking' | 'passed' | 'blocked'>;
  stage: 'idle' | 'sending' | 'gateway' | 'layers' | 'routing' | 'response' | 'done';
  resultType: 'none' | 'success' | 'blocked';
  resultText: string;
}

// ---- Timeline ----
export interface TimelineEvent {
  id: string;
  time: string;
  icon: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// ---- UI ----
export interface UIState {
  selectedServiceId: string | null;
  configPanelOpen: boolean;
  infoPanelKey: string | null;
  showOnboarding: boolean;
}

// ---- Presets ----
export interface AttackPreset {
  id: string;
  name: string;
  icon: string;
  payload: string;
  blockedBy: LayerType;
  reason: string;
}

export interface ServicePreset {
  name: string;
  icon: string;
  routePrefix: string;
  port: number;
  color: string;
  defaultPolicies: Policies;
}

// ---- Root Store ----
export interface AppState {
  services: Service[];
  deployPipeline: DeployPipeline;
  gateway: GatewayConfig;
  simulation: SimulationState;
  timeline: TimelineEvent[];
  ui: UIState;

  // Actions
  addService: (preset: ServicePreset) => void;
  removeService: (id: string) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  updateGateway: (updates: Partial<GatewayConfig>) => void;
  reorderLayers: (newOrder: LayerType[]) => void;
  setSimulation: (updates: Partial<SimulationState>) => void;
  setDeployPipeline: (updates: Partial<DeployPipeline>) => void;
  setUI: (updates: Partial<UIState>) => void;
  addEvent: (icon: string, text: string, type: TimelineEvent['type']) => void;
  clearTimeline: () => void;
  resetAll: () => void;
  exportScenario: () => string;
  importScenario: (json: string) => boolean;
}

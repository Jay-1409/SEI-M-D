import type { ServicePreset, AttackPreset, Policies, TrivyResult, NiktoResult } from './types';

// ============================================================
// Default Policies
// ============================================================
export const DEFAULT_POLICIES: Policies = {
  requireApiKey: false,
  rateLimit: 100,
  wafSensitivity: 'medium',
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// ============================================================
// 5 Service Presets
// ============================================================
export const SERVICE_PRESETS: ServicePreset[] = [
  { name: 'Users API', icon: '👤', routePrefix: '/users', port: 8080, color: '#3b9eff', defaultPolicies: { ...DEFAULT_POLICIES } },
  { name: 'Payments',  icon: '💳', routePrefix: '/payments', port: 8081, color: '#00e676', defaultPolicies: { ...DEFAULT_POLICIES, requireApiKey: true, wafSensitivity: 'high' } },
  { name: 'Auth',      icon: '🔐', routePrefix: '/auth', port: 8082, color: '#ffb300', defaultPolicies: { ...DEFAULT_POLICIES, rateLimit: 30 } },
  { name: 'Notify',    icon: '🔔', routePrefix: '/notify', port: 8083, color: '#b388ff', defaultPolicies: { ...DEFAULT_POLICIES } },
  { name: 'Custom',    icon: '⚙️', routePrefix: '/custom', port: 8084, color: '#ff6e40', defaultPolicies: { ...DEFAULT_POLICIES } },
];

// ============================================================
// 5 Attack Presets
// ============================================================
export const ATTACK_PRESETS: AttackPreset[] = [
  { id: 'sqli',      name: 'SQL Injection',   icon: '💉', payload: "' OR 1=1 --",                    blockedBy: 'waf',        reason: 'SQLi tautology pattern detected in query' },
  { id: 'xss',       name: 'XSS Attack',      icon: '🔥', payload: '<script>alert(cookie)<\/script>', blockedBy: 'waf',        reason: 'Script tag injection in request body' },
  { id: 'flood',     name: 'Rate Flood',      icon: '🌊', payload: '100+ req/s from 192.168.1.42',   blockedBy: 'rateLimit',  reason: 'Exceeded 100 req/min from single IP' },
  { id: 'badkey',    name: 'Invalid API Key',  icon: '🔑', payload: 'X-API-Key: fake-12345',          blockedBy: 'apiKeyAuth', reason: 'API key not found in registry' },
  { id: 'traversal', name: 'Path Traversal',  icon: '📂', payload: '../../etc/passwd',                blockedBy: 'waf',        reason: 'Path traversal pattern in URL' },
];

// ============================================================
// Deploy scan presets
// ============================================================
export const TRIVY_CLEAN: TrivyResult = {
  status: 'passed', critical: 0, high: 0, medium: 2, low: 5,
  findings: [
    { severity: 'medium', description: 'OpenSSL 3.0.8 → update available' },
    { severity: 'low', description: 'GNU libc minor advisory' },
  ],
};
export const TRIVY_VULNERABLE: TrivyResult = {
  status: 'failed', critical: 3, high: 7, medium: 12, low: 8,
  findings: [
    { severity: 'critical', description: 'CVE-2024-3094: XZ Utils backdoor' },
    { severity: 'critical', description: 'CVE-2023-44487: HTTP/2 Rapid Reset' },
    { severity: 'critical', description: 'CVE-2024-21626: runc container escape' },
    { severity: 'high', description: 'CVE-2023-5678: OpenSSL DoS' },
  ],
};
export const NIKTO_CLEAN: NiktoResult = {
  status: 'passed', issueCount: 1,
  findings: [
    { severity: 'low', description: 'X-Content-Type-Options header missing' },
  ],
};
export const NIKTO_MISCONFIGURED: NiktoResult = {
  status: 'failed', issueCount: 6,
  findings: [
    { severity: 'high', description: 'Directory listing enabled on /admin/' },
    { severity: 'high', description: '.env file publicly accessible' },
    { severity: 'medium', description: 'Server-Tokens header exposes version' },
  ],
};

// ============================================================
// Component info (plain-English explanations)
// ============================================================
export const COMPONENT_INFO: Record<string, { title: string; what: string; why: string; impact: string }> = {
  gateway: {
    title: '🛡️ API Gateway',
    what: 'The single entry point for ALL traffic. Every request must pass through before reaching any microservice.',
    why: 'Without it, services would be directly exposed to the internet with no security checks.',
    impact: 'If removed, attackers could directly access internal services, bypassing all protections.',
  },
  waf: {
    title: '🛡 WAF (Web Application Firewall)',
    what: 'Scans every request for attack patterns: 55+ SQL injection rules, 30+ XSS patterns, and malicious header detection.',
    why: 'SQL injection and XSS are the most common web attacks. WAF catches them before they reach your code.',
    impact: 'If disabled, malicious queries could steal your database or hijack user sessions.',
  },
  rateLimit: {
    title: '⏱ Rate Limiter',
    what: 'Counts requests per IP using Redis sliding windows. Blocks clients exceeding the configured limit.',
    why: 'Prevents DDoS floods, brute-force attacks, and resource abuse.',
    impact: 'If disabled, a single bot could overwhelm your service with millions of requests.',
  },
  apiKeyAuth: {
    title: '🔑 API Key Auth',
    what: 'Validates that requests include a registered API key. Supports per-service, per-route key requirements.',
    why: 'Ensures only authorized clients can access protected services.',
    impact: 'If disabled, anyone on the internet could call your API anonymously.',
  },
  trivy: {
    title: '🔍 Trivy Scanner',
    what: 'Scans Docker images for known CVEs (Common Vulnerabilities and Exposures) before deployment.',
    why: 'Catches vulnerable base images and dependencies before they enter your cluster.',
    impact: 'If skipped, a container with a critical exploit could run in production.',
  },
  nikto: {
    title: '🕷 Nikto Scanner',
    what: 'Tests the deployed web server for common misconfigurations: exposed files, missing headers, directory listings.',
    why: 'Server misconfigurations are easy to exploit and easy to fix — if caught.',
    impact: 'If skipped, attackers could find exposed .env files, admin endpoints, or outdated server info.',
  },
  policyGate: {
    title: '🚦 Policy Gate',
    what: 'Decision point that evaluates Trivy + Nikto results. If critical/high findings exceed threshold, deployment is blocked.',
    why: 'Automated security gate prevents vulnerable code from reaching production.',
    impact: 'If removed, known-vulnerable images could be deployed without review.',
  },
  cluster: {
    title: '☸️ Kubernetes Cluster',
    what: 'All services run as ClusterIP — they have NO public IP. Only reachable through the Gateway.',
    why: 'Network isolation ensures services are protected by the full security pipeline.',
    impact: 'If services were exposed directly, all security layers would be bypassed.',
  },
  deployer: {
    title: '⚙️ Deployer Service',
    what: 'Orchestrates the full deploy lifecycle: image upload → scans → policy check → K8s deployment → gateway registration.',
    why: 'Automates secure deployment so developers don\'t need to manually handle security checks.',
    impact: 'Without it, each deployment step would need manual execution and verification.',
  },
};

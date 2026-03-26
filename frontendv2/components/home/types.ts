export interface ServiceInfo {
  service_name: string;
  docker_image: string;
  container_port: number;
  public_url: string;
  status: string;
  scan_status?: string | null;
}

export interface TrivyVulnerability {
  id: string;
  severity: string;
  pkg_name: string;
}

export interface TrivyResult {
  scan_status: string;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  vulnerabilities: TrivyVulnerability[];
  error?: string;
}

export type StatusBoxState =
  | {
      kind: "success";
      internalUrl: string;
      publicUrl: string | null;
    }
  | {
      kind: "error";
      message: string;
    };

export type TrivyState =
  | { kind: "disabled" }
  | { kind: "ready" }
  | { kind: "scanning" }
  | { kind: "error"; message: string }
  | { kind: "result"; result: TrivyResult };

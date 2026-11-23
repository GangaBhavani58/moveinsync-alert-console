export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus =
  | 'OPEN'
  | 'ESCALATED'
  | 'AUTO_CLOSED'
  | 'RESOLVED';

export type AlertSource =
  | 'tracking-svc'
  | 'billing-svc'
  | 'auth-svc';

export interface AlertHistory {
  state: AlertStatus;
  ts: string;
  note?: string;
}

export interface Alert {
  id: string;
  source: AlertSource;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
  history: AlertHistory[];
}
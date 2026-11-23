import { Injectable, signal } from '@angular/core';
import { Alert, AlertSeverity, AlertStatus, AlertSource } from '../models/alert.model';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly alertsState = signal<Alert[]>(this.generateAlerts());

  // Components can read the alerts but cannot modify the signal directly.
  readonly alerts = this.alertsState.asReadonly();

  private generateAlerts(): Alert[] {
    const severities: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    const statuses: AlertStatus[] = ['OPEN', 'ESCALATED', 'AUTO_CLOSED', 'RESOLVED'];

    const sources: AlertSource[] = ['tracking-svc', 'billing-svc', 'auth-svc'];

    return Array.from({ length: 60 }, (_, index) => {
      const number = index + 1;
      const id = `AL-${String(number).padStart(3, '0')}`;

      const severity = severities[index % severities.length];

      const status = statuses[Math.floor(index / 4) % statuses.length];

      const source = sources[Math.floor(index / 2) % sources.length];

      const createdAt = new Date(Date.now() - (60 - number) * 17 * 60 * 1000).toISOString();

      const history: Alert['history'] = [
        {
          state: 'OPEN',
          ts: createdAt,
        },
      ];

      if (status !== 'OPEN') {
        history.push({
          state: status,
          ts: new Date(new Date(createdAt).getTime() + 5 * 60 * 1000).toISOString(),
        });
      }

      return {
        id,
        source,
        severity,
        status,
        createdAt,
        history,
      };
    }).map((alert) => {
      // Include the exact example from the assignment.
      if (alert.id === 'AL-042') {
        return {
          ...alert,
          source: 'billing-svc',
          severity: 'HIGH',
          status: 'ESCALATED',
          createdAt: '2026-08-17T22:10:00Z',
          history: [
            {
              state: 'OPEN',
              ts: '2026-08-17T22:10:00Z',
            },
            {
              state: 'ESCALATED',
              ts: '2026-08-17T22:15:00Z',
            },
          ],
        };
      }

      return alert;
    });
  }

  async resolveAlert(id: string, note: string): Promise<void> {
    // Simulate the required backend save.
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    this.alertsState.update((alerts) =>
      alerts.map((alert) => {
        if (alert.id !== id) {
          return alert;
        }

        return {
          ...alert,
          status: 'RESOLVED',
          history: [
            ...alert.history,
            {
              state: 'RESOLVED',
              ts: new Date().toISOString(),
              note,
            },
          ],
        };
      }),
    );
  }
}

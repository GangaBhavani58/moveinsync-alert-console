import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from './services/alert';
import { Alert, AlertSeverity, AlertStatus, AlertSource } from './models/alert.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  readonly today = new Date();

  readonly alerts = this.alertService.alerts;

  readonly selectedId = signal<string | null>('AL-042');
  readonly statusFilter = signal('');
  readonly severityFilter = signal('');
  readonly sourceFilter = signal('');
  readonly isSaving = signal(false);
  readonly formError = signal('');

  readonly selectedAlert = computed(
    () => this.alerts().find((alert) => alert.id === this.selectedId()) ?? null,
  );
  readonly isSelectedInFilteredResults = computed(() =>
    this.filteredAlerts().some((alert) => alert.id === this.selectedId()),
  );

  readonly filteredAlerts = computed(() => {
    return [...this.alerts()]
      .filter((alert) => !this.statusFilter() || alert.status === this.statusFilter())
      .filter((alert) => !this.severityFilter() || alert.severity === this.severityFilter())
      .filter((alert) => !this.sourceFilter() || alert.source === this.sourceFilter())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  readonly openCount = computed(() => this.alerts().filter((a) => a.status === 'OPEN').length);

  readonly escalatedCount = computed(
    () => this.alerts().filter((a) => a.status === 'ESCALATED').length,
  );

  readonly criticalCount = computed(
    () => this.alerts().filter((a) => a.severity === 'CRITICAL').length,
  );

  readonly resolveForm = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.pattern(/.*\S.*/)]],
  });

  readonly canResolve = computed(() => {
    const status = this.selectedAlert()?.status;
    return status === 'OPEN' || status === 'ESCALATED';
  });

  readonly severities: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  readonly statuses: AlertStatus[] = ['OPEN', 'ESCALATED', 'AUTO_CLOSED', 'RESOLVED'];

  readonly sources: AlertSource[] = ['tracking-svc', 'billing-svc', 'auth-svc'];

  selectAlert(alert: Alert): void {
    this.selectedId.set(alert.id);
    this.resolveForm.reset();
    this.formError.set('');
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.severityFilter.set('');
    this.sourceFilter.set('');
  }

  async resolveSelectedAlert(): Promise<void> {
    const alert = this.selectedAlert();

    if (!alert || !this.canResolve() || this.isSaving()) {
      return;
    }

    if (this.resolveForm.invalid) {
      this.resolveForm.markAllAsTouched();
      this.formError.set('Please enter a valid resolution note.');
      return;
    }

    const note = this.resolveForm.controls.note.value.trim();

    if (!note) {
      this.formError.set('Resolution note cannot be empty.');
      return;
    }

    this.formError.set('');
    this.isSaving.set(true);

    try {
      await this.alertService.resolveAlert(alert.id, note);
      this.resolveForm.reset();
    } catch {
      this.formError.set('Unable to resolve this alert. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  getSeverityClass(severity: AlertSeverity): string {
    return severity.toLowerCase();
  }

  getStatusClass(status: AlertStatus): string {
    return status.toLowerCase().replace('_', '-');
  }
}

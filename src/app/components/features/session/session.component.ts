import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgIf} from '@angular/common';
import {SessionStateService} from '../../../services/session/session-state.service';
import {SessionMonitoringService} from '../../../services/session/session-monitoring.service';
import {SessionActionsService} from '../../../services/session/session-actions.service';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss'
})
export class SessionComponent implements OnInit, OnDestroy {
  sessionState = inject(SessionStateService);
  sessionActions = inject(SessionActionsService);
  sessionActive = this.sessionState.sessionActive;
  sessionError = this.sessionState.sessionError;
  private sessionMonitoring = inject(SessionMonitoringService);

  ngOnInit(): void {
    this.sessionMonitoring.monitorSession();
  }

  ngOnDestroy(): void {
    this.sessionMonitoring.stopMonitoringSession();
  }

  async startSession(): Promise<void> {
    try {
      await this.sessionActions.startSession();
    } catch (error) {
      console.error('Ошибка при запуске сессии:', error);
    }
  }

  async updateSession(): Promise<void> {
    try {
      await this.sessionActions.updateSession();
    } catch (error) {
      console.error('Ошибка при обновлении сессии:', error);
    }
  }

  async endSession(): Promise<void> {
    try {
      await this.sessionActions.endSession();
    } catch (error) {
      console.error('Ошибка при завершении сессии:', error);
    }
  }
}

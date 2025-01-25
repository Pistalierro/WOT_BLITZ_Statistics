import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgIf} from '@angular/common';
import {SessionStateService} from '../../../services/session/session-state.service';
import {SessionMonitoringService} from '../../../services/session/session-monitoring.service';
import {SessionActionsService} from '../../../services/session/session-actions.service';
import {TankDeltaInterface} from '../../../models/tanks-response.model';
import {MatTableModule} from '@angular/material/table';
import {CdkTableModule} from '@angular/cdk/table';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, MatTableModule, // Добавьте сюда MatTableModule
    CdkTableModule,],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss'
})
export class SessionComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['image', 'name', 'battles', 'winRate', 'damageDealt'];
  sessionState = inject(SessionStateService);
  sessionActions = inject(SessionActionsService);
  sessionActive = this.sessionState.sessionActive;
  sessionError = this.sessionState.sessionError;
  tanksDelta: TankDeltaInterface[] = [];
  private sessionMonitoring = inject(SessionMonitoringService);

  get intermediateTanksDelta(): TankDeltaInterface[] {
    return this.sessionState.intermediateStats()?.tanksDelta ?? [];
  }

  ngOnInit(): void {
    this.sessionMonitoring.restoreSession()
      .then(() => {
        this.sessionMonitoring.monitorSession().then();
      })
      .catch(error => {
        console.error('Ошибка при восстановлении сессии:', error);
      });
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

  private updateTanksDelta(): void {
    const sessionData = this.sessionState.intermediateStats();
    if (sessionData?.tanksDelta) {
      this.tanksDelta = sessionData.tanksDelta;
    }
  }
}

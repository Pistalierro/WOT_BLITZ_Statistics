import {Component, effect, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgClass, NgForOf, NgIf, NgStyle} from '@angular/common';
import {SessionStateService} from '../../../services/session/session-state.service';
import {SessionMonitoringService} from '../../../services/session/session-monitoring.service';
import {SessionActionsService} from '../../../services/session/session-actions.service';
import {TankDeltaInterface} from '../../../models/tanks-response.model';
import {MatTableModule} from '@angular/material/table';
import {CdkTableModule} from '@angular/cdk/table';
import {MatSort} from '@angular/material/sort';
import {getFlagUrl, tankTypes, toRoman} from '../../../mock/tank-utils';
import {ANIMATIONS} from '../../../mock/animations';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, MatTableModule, // Добавьте сюда MatTableModule
    CdkTableModule, NgForOf, NgStyle, NgClass,],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss',
  animations: [ANIMATIONS.slideIn, ANIMATIONS.fadeIn],
})
export class SessionComponent implements OnInit, OnDestroy {

  sessionState = inject(SessionStateService);
  sessionActions = inject(SessionActionsService);
  sessionActive = this.sessionState.sessionActive;
  sessionError = this.sessionState.sessionError;
  tanksDelta: TankDeltaInterface[] = [];
  @ViewChild(MatSort) sort!: MatSort;
  isFlipped: boolean[] = [];
  protected readonly tankTypes = tankTypes;
  protected readonly toRoman = toRoman;
  protected readonly getFlagUrl = getFlagUrl;
  private sessionMonitoring = inject(SessionMonitoringService);

  constructor() {
    effect(() => {
      const sessionTanksList = this.sessionState.intermediateStats()?.tanksDelta;
      if (sessionTanksList) {
        this.tanksDelta = sessionTanksList;
        this.isFlipped = new Array(sessionTanksList.length).fill(false);
      }
    });
  }

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

  toggleFlip(index: number): void {
    this.isFlipped[index] = !this.isFlipped[index];
  }
}

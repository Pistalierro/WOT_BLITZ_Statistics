import {AfterViewInit, Component, effect, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgIf, NgStyle} from '@angular/common';
import {SessionStateService} from '../../../services/session/session-state.service';
import {SessionMonitoringService} from '../../../services/session/session-monitoring.service';
import {SessionActionsService} from '../../../services/session/session-actions.service';
import {TankDeltaInterface} from '../../../models/tanks-response.model';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {CdkTableModule} from '@angular/cdk/table';
import {SessionDataInterface} from '../../../models/battle-session.model';
import {MatSort} from '@angular/material/sort';
import {getFlagUrl, tankTypes, toRoman} from '../../../mock/tank-utils';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, MatTableModule, // Добавьте сюда MatTableModule
    CdkTableModule, NgStyle,],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss'
})
export class SessionComponent implements OnInit, AfterViewInit, OnDestroy {

  displayedColumns: string[] = ['mainInfo', 'battles', 'winRate', 'avgDamage'];
  dataSource = new MatTableDataSource<SessionDataInterface>([]);

  sessionState = inject(SessionStateService);
  sessionActions = inject(SessionActionsService);
  sessionActive = this.sessionState.sessionActive;
  sessionError = this.sessionState.sessionError;
  tanksDelta: TankDeltaInterface[] = [];
  @ViewChild(MatSort) sort!: MatSort;
  // }
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly toRoman = toRoman;
  protected readonly tankTypes = tankTypes;
  private sessionMonitoring = inject(SessionMonitoringService);

  constructor() {
    effect(() => {
      const sessionTanksList = this.sessionState.intermediateStats()?.tanksDelta;
      if (sessionTanksList) {
        this.dataSource.data = sessionTanksList;
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

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.sessionMonitoring.stopMonitoringSession();
  }

  // private updateTanksDelta(): void {
  //   const sessionData = this.sessionState.intermediateStats();
  //   if (sessionData?.tanksDelta) {
  //     this.tanksDelta = sessionData.tanksDelta;
  //   }

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

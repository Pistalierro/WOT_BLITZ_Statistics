import {ChangeDetectorRef, Component, effect, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DecimalPipe, NgClass, NgForOf, NgIf, NgStyle} from '@angular/common';
import {SessionStateService} from '../../../services/session/session-state.service';
import {SessionMonitoringService} from '../../../services/session/session-monitoring.service';
import {SessionActionsService} from '../../../services/session/session-actions.service';
import {TankDeltaInterface} from '../../../models/tank/tanks-response.model';
import {MatSort} from '@angular/material/sort';
import {getFlagUrl, tankTypes, toRoman} from '../../../shared/helpers/tank-utils';
import {ANIMATIONS} from '../../../shared/helpers/animations';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {OdometerDirective} from '../../../shared/directives/odometer.directive';
import {sanitizeUrl} from '../../../shared/helpers/utils';
import {TranslatePipe} from '@ngx-translate/core';
import {UtilsService} from '../../../shared/utils.service';


@Component({
  selector: 'app-session',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    NgIf,
    DecimalPipe,
    OdometerDirective,
    NgForOf,
    NgClass,
    NgStyle,
    TranslatePipe,
  ],
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
  utilsService = inject(UtilsService);
  protected readonly tankTypes = tankTypes;
  protected readonly toRoman = toRoman;
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly sanitizeUrl = sanitizeUrl;
  private sessionMonitoring = inject(SessionMonitoringService);
  private cdr = inject(ChangeDetectorRef);

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
      .then(() => this.sessionMonitoring.monitorSession())
      .catch(error => console.error('Ошибка при восстановлении сессии:', error));
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
      this.cdr.detectChanges();
      console.log('Intermediate Stats:', this.sessionState.intermediateStats());
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

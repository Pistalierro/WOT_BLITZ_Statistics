import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgIf} from '@angular/common';
import {SessionStoreService} from '../../../services/session/session-store.service';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss'
})
export class SessionComponent implements OnInit, OnDestroy {
  sessionStore = inject(SessionStoreService);
  sessionActive = this.sessionStore.sessionActive;
  sessionError = this.sessionStore.sessionError;

  ngOnInit(): void {
    this.sessionStore.restoreSession().finally(() => {
      this.sessionStore.monitorSession();
    });
  }

  ngOnDestroy(): void {
    this.sessionStore.stopMonitoringSession();
  }

  async startSession(): Promise<void> {
    try {
      await this.sessionStore.startSession();
    } catch (error) {
      console.error('Ошибка при запуске сессии:', error);
    }
  }

  async updateSession(): Promise<void> {
    try {
      await this.sessionStore.updateSession();
    } catch (error) {
      console.error('Ошибка при обновлении сессии:', error);
    }
  }

  async endSession(): Promise<void> {
    try {
      await this.sessionStore.endSession();
    } catch (error) {
      console.error('Ошибка при завершении сессии:', error);
    }
  }
}

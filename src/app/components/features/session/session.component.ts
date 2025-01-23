import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {SessionStoreService} from '../../../services/session-store.service';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgIf} from '@angular/common';

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
    this.sessionStore.restoreSession().then(() => {
      this.sessionStore.monitorSession().then();
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

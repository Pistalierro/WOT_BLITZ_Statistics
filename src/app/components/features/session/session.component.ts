import {Component, OnInit, signal} from '@angular/core';
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
export class SessionComponent implements OnInit {
  sessionActive = signal(false);
  sessionError = signal<string | null>(null);

  constructor(public sessionStore: SessionStoreService) {
  }

  ngOnInit(): void {
    // Восстанавливаем сессию при загрузке компонента
    this.sessionStore.restoreSession().then(() => {
      this.sessionActive.set(this.sessionStore.sessionActive());
    });
  }

  async startSession(): Promise<void> {
    try {
      await this.sessionStore.startSession();
      this.sessionActive.set(true);
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
      this.sessionActive.set(false);
    } catch (error) {
      console.error('Ошибка при завершении сессии:', error);
    }
  }
}

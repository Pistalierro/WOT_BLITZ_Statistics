import {Component, inject} from '@angular/core';
import {SessionService} from '../../../services/session.service';
import {PlayerStoreService} from '../../../services/player-store.service';
import {AuthService} from '../../../services/auth.service';
import {DatePipe, JsonPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    JsonPipe
  ],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss'
})
export class SessionComponent {
  private authService = inject(AuthService);
  userSignal = this.authService.userSignal;
  nicknameSignal = this.authService.nicknameSignal;

  private sessionService = inject(SessionService);
  sessionId = this.sessionService.getSessionId();
  sessionData = this.sessionService.getSessionData();

  private playerStore = inject(PlayerStoreService);
  playerData = this.playerStore.playerData;

  async startSession(): Promise<void> {
    const userId = this.userSignal()?.uid;
    const playerStats = this.playerData();

    if (!userId || !playerStats) {
      console.error('Пользователь не авторизован или данные игрока отсутствуют');
      return;
    }

    await this.sessionService.startSession(userId, playerStats);
    console.log('Сессия начата:', this.sessionId());
  }

  async updateSession(): Promise<void> {
    const playerStats = this.playerData();

    if (!this.sessionId() || !playerStats) {
      console.error('Сессия не начата или данные игрока отсутствуют');
      return;
    }

    await this.sessionService.updateSession(playerStats);
    console.log('Сессия обновлена:', this.sessionId());
  }
}

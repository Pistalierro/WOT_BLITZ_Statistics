import {inject, Injectable} from '@angular/core';
import {SessionStateService} from './session-state.service';
import {collection, doc, setDoc} from '@angular/fire/firestore';
import {SessionUtilsService} from './session-utils.service';

@Injectable({
  providedIn: 'root'
})
export class SessionActionsService {

  private sessionState = inject(SessionStateService);
  private sessionUtils = inject(SessionUtilsService);

  async startSession(): Promise<void> {
    try {
      this.sessionState.sessionError.set(null);
      const user = this.sessionState.auth.currentUser;
      if (!user) {
        this.sessionState.sessionError.set('Пожалуйста, авторизуйтесь');
        return;
      }

      const playerData = this.sessionState.playerStore.playerData();
      if (!playerData) throw new Error('Нет данных об игроке.');

      const startStatsValue = playerData.statistics.all;

      const userDocRef = doc(this.sessionState.firestore, 'users', user.uid);
      const sessionDocRef = doc(collection(userDocRef, 'sessions'), 'activeSession');

      const sessionData = {
        userId: user.uid,
        nickname: playerData.nickname,
        startStats: startStatsValue,
        startTimestamp: Date.now(),
        isActive: true,
      };

      await setDoc(sessionDocRef, sessionData);

      this.sessionState.sessionId.set(sessionDocRef.id);
      this.sessionState.sessionActive.set(true);
      this.sessionState.startStats.set(startStatsValue);
      this.sessionState.intermediateStats.set(null);

      console.log('Сессия запущена:', sessionData);
    } catch (error: any) {
      this.sessionUtils.handleError(error, 'Ошибка при запуске сессии');
    }
  }

  async updateSession(): Promise<void> {
    await this.sessionUtils.processSessionUpdate({isFinal: false});
  }

  async endSession(): Promise<void> {
    try {
      await this.sessionUtils.processSessionUpdate({isFinal: true});
      this.sessionState.sessionActive.set(false);
    } catch (error: any) {
      console.log('Ошибка при завершении сессии:', error);
    }
  }
}

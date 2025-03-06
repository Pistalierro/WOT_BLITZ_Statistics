import {inject, Injectable} from '@angular/core';
import {SessionStateService} from './session-state.service';
import {collection, doc, setDoc} from '@angular/fire/firestore';
import {SessionUtilsService} from './session-utils.service';
import {TanksService} from '../tanks/tanks.service';
import {PlayerStoreService} from '../player/player-store.service';


@Injectable({
  providedIn: 'root'
})
export class SessionActionsService {

  private sessionState = inject(SessionStateService);
  private sessionUtils = inject(SessionUtilsService);
  private tanksService = inject(TanksService);
  private playerStore = inject(PlayerStoreService);

  async startSession(): Promise<void> {
    try {
      this.sessionState.sessionError.set(null);
      const user = this.sessionState.auth.currentUser;
      if (!user) {
        this.sessionState.sessionError.set('Пожалуйста, авторизуйтесь');
        return;
      }

      const playerData = this.playerStore.playerDataSignal();
      if (!playerData) throw new Error('Нет данных об игроке.');

      const startStatsValue = playerData.statistics.all;

      const startTanksList = this.tanksService.tanksList();
      if (!startTanksList.length) throw new Error('Список танков в начале сессии отсутствует!');

      const userDocRef = doc(this.sessionState.firestore, 'users', user.uid);
      const sessionDocRef = doc(collection(userDocRef, 'sessions'), 'activeSession');

      const sessionData = {
        userId: user.uid,
        nickname: playerData.nickname,
        startStats: startStatsValue,
        startTanksList: startTanksList,
        startTimestamp: Date.now(),
        isActive: true,
      };
      await setDoc(sessionDocRef, sessionData);
      this.sessionState.sessionId.set(sessionDocRef.id);
      this.sessionState.sessionActive.set(true);
      this.sessionState.startStats.set(startStatsValue);
      this.sessionState.intermediateStats.set(null);
      this.sessionState.startsTanksStats.set(startTanksList);

      localStorage.setItem('activeSessionId', sessionDocRef.id);
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
      localStorage.removeItem('activeSessionId');
    } catch (error: any) {
      console.log('Ошибка при завершении сессии:', error);
    }
  }
}

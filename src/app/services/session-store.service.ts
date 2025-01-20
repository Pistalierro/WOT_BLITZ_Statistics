import {inject, Injectable, signal} from '@angular/core';
import {Auth} from '@angular/fire/auth';
import {collection, doc, Firestore, getDoc, setDoc, updateDoc} from '@angular/fire/firestore';
import {PlayerStoreService} from './player-store.service';

@Injectable({
  providedIn: 'root',
})
export class SessionStoreService {
  sessionId = signal<string | null>(null);
  sessionActive = signal<boolean>(false);
  sessionError = signal<string | null>(null);
  startStats = signal<any>(null);
  endStats = signal<any>(null);
  sessionStats = signal<any>(null);
  intermediateStats = signal<any>(null);

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private playerStore = inject(PlayerStoreService);

  // Запуск новой сессии
  async startSession(): Promise<void> {
    try {
      this.sessionError.set(null);
      const user = this.auth.currentUser;
      if (!user) throw new Error('Пользователь не авторизован');

      const playerData = this.playerStore.playerData();
      if (!playerData) throw new Error('Нет данных об игроке.');
      const statsStartValue = playerData.statistics.all;

      const sessionsRef = collection(this.firestore, 'sessions');
      const sessionDocRef = doc(sessionsRef);

      const sessionData = {
        userId: user.uid,
        nickname: playerData.nickname,
        startStats: statsStartValue,
        startTimestamp: Date.now(),
        isActive: true,
      };

      await setDoc(sessionDocRef, sessionData);

      this.sessionId.set(sessionDocRef.id);
      this.sessionActive.set(true);
      this.startStats.set(statsStartValue);
      this.intermediateStats.set(null);

      // Сохраняем sessionId в localStorage
      localStorage.setItem('activeSessionId', sessionDocRef.id);

      console.log('Сессия запущена! ID:', sessionDocRef.id);
    } catch (error: any) {
      this.handleError(error, 'Ошибка при запуске сессии');
    }
  }

  // Обновление текущей сессии
  async updateSession(): Promise<void> {
    await this._processSessionUpdate({isFinal: false});
  }

  // Завершение сессии
  async endSession(): Promise<void> {
    await this._processSessionUpdate({isFinal: true});
  }

  // Восстановление сессии при загрузке приложения
  async restoreSession(): Promise<void> {
    const savedSessionId = localStorage.getItem('activeSessionId');
    if (!savedSessionId) return;

    try {
      const sessionDocRef = doc(this.firestore, 'sessions', savedSessionId);
      const sessionSnapshot = await getDoc(sessionDocRef);

      if (sessionSnapshot.exists()) {
        const sessionData = sessionSnapshot.data();
        if (sessionData['isActive']) {
          this.sessionId.set(savedSessionId);
          this.sessionActive.set(true);
          this.startStats.set(sessionData['startStats']);
          this.intermediateStats.set(sessionData['updatedDelta'] || null);
          console.log('Сессия восстановлена:', sessionData);
        } else {
          console.log('Сессия завершена, удаляю localStorage');
          localStorage.removeItem('activeSessionId');
        }
      } else {
        console.log('Сессия не найдена в Firestore');
        localStorage.removeItem('activeSessionId');
      }
    } catch (error: any) {
      this.handleError(error, 'Ошибка при восстановлении сессии');
    }
  }

  // Приватный метод для обработки обновлений и завершений сессии
  private async _processSessionUpdate(options: { isFinal: boolean }): Promise<void> {
    const {isFinal} = options;

    try {
      this.sessionError.set(null);
      const user = this.auth.currentUser;
      if (!user) throw new Error('Пользователь не авторизован');

      const currentSessionId = this.sessionId();
      if (!currentSessionId) throw new Error('Сессия не найдена. Сначала запустите сессию.');

      const nickname = this.playerStore.nickname();
      if (!nickname) throw new Error('Нет никнейма');

      await this.playerStore.loadPlayerData(nickname);

      const playerData = this.playerStore.playerData();
      if (!playerData) throw new Error('Нет данных об игроке.');
      const updatedStatsValue = playerData.statistics.all;
      const startStatsValue = this.startStats();
      if (!startStatsValue) throw new Error('Нет стартовой статистики.');

      const deltaBattles = updatedStatsValue.battles - startStatsValue.battles;
      const deltaWins = updatedStatsValue.wins - startStatsValue.wins;
      const deltaDamage = updatedStatsValue.damage_dealt - startStatsValue.damage_dealt;
      const winRate = deltaBattles > 0 ? (deltaWins / deltaBattles) * 100 : 0;
      const avgDamage = deltaBattles > 0 ? deltaDamage / deltaBattles : 0;

      const sessionDelta = {
        battles: deltaBattles,
        wins: deltaWins,
        damageDealt: deltaDamage,
        winRate,
        avgDamage,
      };

      const sessionDocRef = doc(this.firestore, 'sessions', currentSessionId);
      const updateData: any = {
        updatedStats: updatedStatsValue,
        updatedDelta: sessionDelta,
        updatedTimestamp: Date.now(),
      };

      if (isFinal) {
        updateData.endStats = updatedStatsValue;
        updateData.endTimestamp = Date.now();
        updateData.isActive = false;
        updateData.sessionDelta = sessionDelta;

        this.endStats.set(updatedStatsValue);
        this.sessionStats.set(sessionDelta);
        this.sessionActive.set(false);

        // Удаляем sessionId из localStorage
        localStorage.removeItem('activeSessionId');
      } else {
        this.intermediateStats.set(sessionDelta);
      }

      await updateDoc(sessionDocRef, updateData);
      console.log(`Сессия ${isFinal ? 'завершена' : 'обновлена'}:`, sessionDelta);
    } catch (error: any) {
      this.handleError(error, 'Ошибка при обновлении/завершении сессии');
    }
  }

  // Обработка ошибок
  private handleError(error: any, contextMessage: string): void {
    const userFriendlyMessage = error.message || `${contextMessage}. Попробуйте снова.`;
    this.sessionError.set(userFriendlyMessage);
    console.error(contextMessage, error);
  }
}

import {inject, Injectable, signal} from '@angular/core';
import {Auth} from '@angular/fire/auth';
import {collection, doc, Firestore, setDoc, updateDoc} from '@angular/fire/firestore';
import {PlayerStoreService} from './player-store.service';

@Injectable({
  providedIn: 'root'
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
        isActive: true
      };

      await setDoc(sessionDocRef, sessionData);

      this.sessionId.set(sessionDocRef.id);
      this.sessionActive.set(true);
      this.startStats.set(statsStartValue);
      this.intermediateStats.set(null);

      console.log('Сессия запущена! ID:', sessionDocRef.id);
    } catch (error: any) {
      this.sessionError.set(error.message);
      console.error('Ошибка при старте сессии:', error);
    }
  }

  async updateSession(): Promise<void> {
    try {
      this.sessionError.set(null);
      const user = this.auth.currentUser;
      if (!user) throw new Error('Пользователь не авторизован');

      const currentSessionId = this.sessionId();
      if (!currentSessionId) throw new Error('Сессия не найдена. Сначала запустите сессию.');

      const nickname = this.playerStore.nickname();
      if (!nickname) throw new Error('Нет никнейма');

      await this.playerStore.loadPlayerData(nickname);

      const updatedStatsValue = this.playerStore.playerData()?.statistics.all;
      if (!updatedStatsValue) throw new Error('Не удалось получить обновлённую статистику игрока');

      const sessionDocRef = doc(this.firestore, 'sessions', currentSessionId);
      await updateDoc(sessionDocRef, {
        updatedStats: updatedStatsValue,
        updatedTimestamp: Date.now()
      });

      this.intermediateStats.set(updatedStatsValue);
      console.log('Сессия обновлена с актуальными данными!');
    } catch (error: any) {
      this.sessionError.set(error.message);
      console.error('Ошибка при обновлении сессии:', error);
    }
  }

  async endSession(): Promise<void> {
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
      if (!playerData) throw new Error('Нет данных об игроке для завершения сессии.');

      const endStatsValue = playerData.statistics.all;
      const startStatsValue = this.startStats();
      if (!startStatsValue) throw new Error('Стартовая статистика отсутствует — странная ситуация.');

      const deltaBattles = endStatsValue.battles - startStatsValue.battles;
      const deltaWins = endStatsValue.wins - startStatsValue.wins;
      const deltaDamage = endStatsValue.damage_dealt - startStatsValue.damage_dealt;
      const winRate = deltaBattles > 0 ? (deltaWins / deltaBattles) * 100 : 0;
      const avgDamage = deltaBattles > 0 ? (deltaDamage / deltaBattles) : 0;

      const sessionDelta = {
        battles: deltaBattles,
        wins: deltaWins,
        damageDealt: deltaDamage,
        winRate,
        avgDamage,
      };

      const sessionDocRef = doc(this.firestore, 'sessions', currentSessionId);
      await updateDoc(sessionDocRef, {
        endStats: endStatsValue,
        endTimestamp: Date.now(),
        isActive: false,
        sessionDelta: sessionDelta,
      });

      this.endStats.set(endStatsValue);
      this.sessionStats.set(sessionDelta);
      this.sessionActive.set(false);
      this.intermediateStats.set(null);

      console.log('Сессия завершена!', sessionDelta);

    } catch (error: any) {
      this.sessionError.set(error.message);
      console.error('Ошибка при завершении сессии:', error);
    }
  }
}

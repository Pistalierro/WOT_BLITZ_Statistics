import {inject, Injectable, signal} from '@angular/core';
import {Auth, User} from '@angular/fire/auth';
import {collection, doc, Firestore, getDoc, onSnapshot, setDoc, updateDoc} from '@angular/fire/firestore';
import {PlayerStoreService} from './player-store.service';
import {SessionDeltaInterface, StatsInterface} from '../models/battle-session.model';

@Injectable({
  providedIn: 'root',
})
export class SessionStoreService {
  sessionId = signal<string | null>(null);
  sessionActive = signal<boolean>(false);
  sessionError = signal<string | null>(null);
  startStats = signal<StatsInterface | null>(null);
  endStats = signal<StatsInterface | null>(null);
  sessionStats = signal<SessionDeltaInterface | null>(null);
  intermediateStats = signal<any>(null);

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private playerStore = inject(PlayerStoreService);

  private unsubscribeSnapshot: (() => void) | null = null;

  async startSession(): Promise<void> {
    try {
      this.sessionError.set(null);
      const user = this.auth.currentUser;
      if (!user) {
        this.sessionError.set('Пожалуйста, войдите в аккаунт.');
        return;
      }

      const playerData = this.playerStore.playerData();
      if (!playerData) throw new Error('Нет данных об игроке.');

      const statsStartValue = playerData.statistics.all;
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const sessionDocRef = doc(collection(userDocRef, 'sessions'), 'activeSession');

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
      localStorage.setItem('activeSessionId', sessionDocRef.id);

      console.log('Сессия запущена:', sessionData);
    } catch (error: any) {
      this.handleError(error, 'Ошибка при запуске сессии');
    }
  }


  async updateSession(): Promise<void> {
    await this._processSessionUpdate({isFinal: false});
  }

  async endSession(): Promise<void> {
    try {
      await this._processSessionUpdate({isFinal: true});

      localStorage.removeItem('activeSessionId');
    } catch (error: any) {
      console.error('Ошибка при завершении сессии:', error);
    }
  }

  async monitorSession(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.log('Пользователь не авторизован');
      this.sessionActive.set(false);
      return;
    }

    const sessionDocRef = doc(this.firestore, 'users', user.uid, 'sessions', 'activeSession');
    this.unsubscribeSnapshot = onSnapshot(sessionDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const sessionData = snapshot.data();
          if (sessionData['isActive']) {
            this.sessionId.set('activeSession');
            this.sessionActive.set(true);
            this.startStats.set(sessionData['startStats'] || null);
            this.intermediateStats.set(sessionData['updatedDelta'] || null);
            console.log('Обновлена информация о сессии:', sessionData);
          } else {
            this.sessionActive.set(false);
            console.log('Активной сессии нет.');
            this.sessionActive.set(false);
          }
        } else {
          console.log('Сессия не найдена.');
          this.sessionActive.set(false);
        }
      }, error => console.log('Ошибка при подписке на изменения сессии:', error)
    );
  }

  stopMonitoringSession(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
      console.log('Отписались от изменений сессии.');
    }
  }

  async restoreSession(): Promise<void> {
    const savedSessionId = localStorage.getItem('activeSessionId');
    if (!savedSessionId) {
      console.log('Нет сохранённой активной сессии в localStorage');
      this.sessionActive.set(false);
      return;
    }

    try {
      const user: User = await new Promise((resolve, reject) => {
        const unsubscribe = this.auth.onAuthStateChanged(
          (authUser) => {
            if (authUser) {
              resolve(authUser);
              unsubscribe();
            } else {
              reject('Пользователь не авторизован');
            }
          },
          (error) => {
            reject(error);
          }
        );
      });

      const sessionDocRef = doc(this.firestore, 'users', user.uid, 'sessions', savedSessionId);
      const sessionSnapshot = await getDoc(sessionDocRef);

      if (sessionSnapshot.exists()) {
        const sessionData = sessionSnapshot.data();
        if (sessionData['isActive']) {
          this.sessionId.set(savedSessionId);
          this.sessionActive.set(true);
          this.startStats.set(sessionData['startStats'] || null);
          this.intermediateStats.set(sessionData['updatedDelta'] || null);
          console.log('Сессия восстановлена из Firestore:', sessionData);
        } else {
          console.log('Сессия завершена. Удаляю данные из localStorage');
          localStorage.removeItem('activeSessionId');
          this.sessionActive.set(false);
        }
      } else {
        console.log('Сессия не найдена в Firestore. Удаляю данные из localStorage');
        localStorage.removeItem('activeSessionId');
        this.sessionActive.set(false);
      }
    } catch (error) {
      console.error('Ошибка при восстановлении сессии:', error);
      this.sessionError.set('Не удалось восстановить сессию. Попробуйте снова.');
      this.sessionActive.set(false);
    }
  }


  private async _processSessionUpdate(options: { isFinal: boolean }): Promise<void> {
    const {isFinal} = options;

    try {
      this.sessionError.set(null);
      const user = this.auth.currentUser;
      if (!user) throw new Error('Пользователь не авторизован');

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

      const sessionDocRef = doc(this.firestore, 'users', user.uid, 'sessions', 'activeSession');
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
      } else {
        this.intermediateStats.set(sessionDelta);
      }

      await updateDoc(sessionDocRef, updateData);
      console.log(`Сессия ${isFinal ? 'завершена' : 'обновлена'}:`, sessionDelta);
    } catch (error: any) {
      this.handleError(error, 'Ошибка при обновлении/завершении сессии');
    }
  }

  private handleError(error: any, contextMessage: string): void {
    const userFriendlyMessage = error.message || `${contextMessage}. Попробуйте снова.`;
    this.sessionError.set(userFriendlyMessage);
    console.error(`[SessionStoreService] ${contextMessage}:`, error);
  }
}

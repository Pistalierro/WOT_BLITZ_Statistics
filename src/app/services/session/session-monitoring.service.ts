import {inject, Injectable} from '@angular/core';
import {SessionStateService} from './session-state.service';
import {doc, getDoc, onSnapshot} from '@angular/fire/firestore';
import {User} from '@angular/fire/auth';
import {SessionDataInterface} from '../../models/session/battle-session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionMonitoringService {

  private sessionState = inject(SessionStateService);

  async monitorSession(): Promise<void> {
    const user = this.sessionState.auth.currentUser;
    if (!user) {
      console.log('Пользователь не авторизован');
      this.sessionState.sessionActive.set(false);
      return;
    }

    const sessionDocRef = doc(this.sessionState.firestore, 'users', user.uid, 'sessions', 'activeSession');

    this.sessionState.unsubscribeSnapshot = onSnapshot(sessionDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.data() as SessionDataInterface;

        if (sessionData.isActive) {
          this.sessionState.sessionId.set('activeSession');
          this.sessionState.sessionActive.set(true);
          this.sessionState.startStats.set(sessionData.startStats || null);
          this.sessionState.intermediateStats.set(sessionData.updatedDelta || null);
          this.sessionState.startsTanksStats.set(sessionData.startTanksList || null);

          // console.log('Обновлена информация о сессии:', sessionData);
        } else {
          console.log('Сессия завершена.');
          this.stopMonitoringSession();
          this.sessionState.sessionActive.set(false);
          localStorage.removeItem('activeSessionId');
        }
      } else {
        console.log('Сессия не найдена.');
        this.stopMonitoringSession();
        this.sessionState.sessionActive.set(false);
        localStorage.removeItem('activeSessionId');
      }
    }, (error) => {
      console.log('Ошибка при подписке на изменения сессии:', error);
    });
  }

  stopMonitoringSession(): void {
    if (this.sessionState.unsubscribeSnapshot) {
      this.sessionState.unsubscribeSnapshot();
      this.sessionState.unsubscribeSnapshot = null;
      console.log('Отписались от изменений сессии.');
    }
  }

  async restoreSession(): Promise<void> {
    const savedSessionId = localStorage.getItem('activeSessionId');
    if (!savedSessionId) {
      console.log('Нет сохранённой активной сессии в localStorage');
      this.sessionState.sessionActive.set(false);
      return;
    }

    try {
      const user: User = await new Promise((resolve, reject) => {
        const unsubscribe = this.sessionState.auth.onAuthStateChanged((authUser) => {
          if (authUser) {
            resolve(authUser);
            unsubscribe();
          } else {
            reject('Пользователь не авторизован');
          }
        }, (error) => {
          reject(error);
        });
      });

      const sessionDocRef = doc(this.sessionState.firestore, 'users', user.uid, 'sessions', savedSessionId);
      const sessionSnapshot = await getDoc(sessionDocRef);

      if (sessionSnapshot.exists()) {
        const sessionData = sessionSnapshot.data() as SessionDataInterface;
        if (sessionData.isActive) {
          this.sessionState.sessionId.set(savedSessionId);
          this.sessionState.sessionActive.set(true);
          this.sessionState.startStats.set(sessionData.startStats || null);
          this.sessionState.startsTanksStats.set(sessionData.startTanksList || []);
          this.sessionState.intermediateStats.set(sessionData.updatedDelta || null);

          // console.log('Сессия восстановлена из Firestore:', sessionData);
        } else {
          console.log('Сессия завершена. Удаляю данные из localStorage');
          localStorage.removeItem('activeSessionId');
          this.sessionState.sessionActive.set(false);
        }
      } else {
        console.log('Сессия не найдена в Firestore. Удаляю данные из localStorage');
        localStorage.removeItem('activeSessionId');
        this.sessionState.sessionActive.set(false);
      }
    } catch (error) {
      console.error('Ошибка при восстановлении сессии:', error);
      this.sessionState.sessionError.set('Не удалось восстановить сессию. Попробуйте снова.');
      this.sessionState.sessionActive.set(false);
    }
  }
}

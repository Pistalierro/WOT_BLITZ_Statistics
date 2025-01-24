import {inject, Injectable} from '@angular/core';
import {SessionStateService} from './session-state.service';
import {doc, onSnapshot} from '@angular/fire/firestore';

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
        console.log('onSnapshot сработал');
        console.log('Данные сессии:', snapshot.data());

        const sessionData = snapshot.data() as any;

        if (sessionData.isActive) {
          this.sessionState.sessionId.set('activeSession');
          this.sessionState.sessionActive.set(true);
          this.sessionState.startStats.set(sessionData.startStats || null);
          this.sessionState.intermediateStats.set(sessionData.updatedDelta || null);

          console.log('Обновлена информация о сессии:', sessionData);
        } else {
          this.sessionState.sessionActive.set(false);
          console.log('Активной сессии нет.');
        }
      } else {
        console.log('Сессия не найдена.');
        this.sessionState.sessionActive.set(false);
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
}

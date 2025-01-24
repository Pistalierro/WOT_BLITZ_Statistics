import {inject, Injectable} from '@angular/core';
import {SessionStateService} from './session-state.service';
import {doc, updateDoc} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class SessionUtilsService {

  sessionState = inject(SessionStateService);

  async processSessionUpdate(options: { isFinal: boolean }): Promise<void> {
    const {isFinal} = options;

    try {
      this.sessionState.sessionError.set(null);
      const user = this.sessionState.auth.currentUser;
      if (!user) throw new Error('Пользователь не авторизован');

      const nickname = this.sessionState.playerStore.nickname();
      if (!nickname) throw new Error('Нет никнейма');

      await this.sessionState.playerStore.loadPlayerData(nickname);
      const playerData = this.sessionState.playerStore.playerData();
      if (!playerData) throw new Error('Нет данных об игроке.');

      const updatedStatsValue = playerData.statistics.all;
      const startStatsValue = this.sessionState.startStats();
      if (!startStatsValue) throw new Error('Нет стартовой статистики!');

      const deltaBattles = updatedStatsValue.battles - startStatsValue.battles;
      const deltaWins = updatedStatsValue.wins - startStatsValue.wins;
      const deltaDamage = updatedStatsValue.damage_dealt - startStatsValue.damage_dealt;
      const winRate = deltaBattles > 0 ? (deltaWins / deltaBattles) * 100 : 0;
      const avgDamage = deltaBattles > 0 ? deltaDamage / deltaBattles : 0;

      const sessionDelta = {
        battles: deltaBattles,
        wins: deltaWins,
        damage: deltaDamage,
        winRate,
        avgDamage,
      };

      const sessionDocRef = doc(this.sessionState.firestore, 'users', user.uid, 'sessions', 'activeSession');

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
      } else {
        this.sessionState.intermediateStats.set(sessionDelta);
      }

      await updateDoc(sessionDocRef, updateData);
      console.log(`Сессия ${isFinal ? 'завершена' : 'обновлена'}:`, sessionDelta);
    } catch (error: any) {

      this.handleError(error, 'Ошибка при обновлении/завершении сессии');
    }
  }
  
  handleError(error: any, contextMessage: string): void {
    const userFriendlyMessage = error.message || `${contextMessage}. Попробуйте снова.`;
    this.sessionState.sessionError.set(userFriendlyMessage);
    console.error(`[SessionActionsService] ${contextMessage}:`, error);
  }
}

import {inject, Injectable} from '@angular/core';
import {SessionStateService} from './session-state.service';
import {doc, updateDoc} from '@angular/fire/firestore';
import {SessionDataInterface, SessionDeltaInterface} from '../../models/session/battle-session.model';
import {TanksService} from '../tanks/tanks.service';
import {Tank, TankDeltaInterface} from '../../models/tank/tanks-response.model';
import {PlayerStoreService} from '../player/player-store.service';

@Injectable({
  providedIn: 'root'
})
export class SessionUtilsService {

  sessionState = inject(SessionStateService);
  tanksService = inject(TanksService);
  private playerStore = inject(PlayerStoreService);

  async processSessionUpdate(options: { isFinal: boolean }): Promise<void> {
    const {isFinal} = options;
    this.sessionState.loadingSignal.set(true);

    try {
      this.sessionState.sessionError.set(null);
      const user = this.sessionState.auth.currentUser;
      if (!user) throw new Error('Пользователь не авторизован');

      const nickname = this.playerStore.nicknameSignal();
      if (!nickname) throw new Error('Нет никнейма');
      await this.playerStore.getPlayerData(nickname);

      const accountId = this.playerStore.accountIdSignal();
      if (!accountId) throw new Error('Account ID отсутствует');
      await this.tanksService.getTanksData(accountId);

      const playerData = this.playerStore.playerDataSignal();
      if (!playerData) throw new Error('Нет данных об игроке.');

      const updatedStatsValue = playerData.statistics.all;
      const startStatsValue = this.sessionState.startStats();

      const startTanksList = this.sessionState.startsTanksStats();
      if (!startTanksList) throw new Error('Начальный список танков отсутствует');
      console.log(startTanksList);
      const updatedTanksList = this.tanksService.tanksList();

      if (!startStatsValue) throw new Error('Нет стартовой статистики!');

      const deltaBattles = updatedStatsValue.battles - startStatsValue.battles;
      const deltaWins = updatedStatsValue.wins - startStatsValue.wins;
      const deltaDamage = updatedStatsValue.damage_dealt - startStatsValue.damage_dealt;
      const winRate = deltaBattles > 0 ? (deltaWins / deltaBattles) * 100 : 0;
      const avgDamage = deltaBattles > 0 ? deltaDamage / deltaBattles : 0;
      const tanksDelta = this.getSessionTanks(startTanksList, updatedTanksList);
      console.log('tanksDelta AFTER getSessionTanks => ', tanksDelta);

      const sessionDelta: SessionDeltaInterface = {
        battles: deltaBattles,
        wins: deltaWins,
        damageDealt: deltaDamage,
        winRate,
        avgDamage,
        tanksDelta
      };

      const sessionDocRef = doc(this.sessionState.firestore, 'users', user.uid, 'sessions', 'activeSession');

      const updateData: Partial<SessionDataInterface> = {
        updatedStats: updatedStatsValue,
        updatedDelta: sessionDelta,
        updatedTimestamp: Date.now(),
        tanksDelta
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
    } finally {
      this.sessionState.loadingSignal.set(false);
    }
  }

  getSessionTanks(startTanksList: Tank[], updatedTankList: Tank[]): TankDeltaInterface[] {
    const startTanksMap = new Map(startTanksList.map(tank => [tank.tank_id, tank]));
    const tanksData = new Map(this.tanksService.tanksList().map(tank => [tank.tank_id, tank]));

    return updatedTankList.map(updatedTank => {
      const startTank = startTanksMap.get(updatedTank.tank_id);
      const globalTank = tanksData.get(updatedTank.tank_id);

      if (startTank) {
        const deltaBattles = updatedTank.all.battles - startTank.all.battles;
        const deltaWins = updatedTank.all.wins - startTank.all.wins;
        const deltaDamage = updatedTank.all.damage_dealt - startTank.all.damage_dealt;
        const winRate = deltaBattles > 0 ? (deltaWins / deltaBattles) * 100 : 0;
        const avgDamage = deltaBattles > 0 ? deltaDamage / deltaBattles : 0;

        if (deltaBattles > 0) {
          return {
            tank_id: updatedTank.tank_id,
            name: updatedTank.name,
            battles: deltaBattles,
            wins: deltaWins,
            damageDealt: deltaDamage,
            winRate,
            avgDamage,
            tier: updatedTank.tier,
            type: updatedTank.type,
            nation: updatedTank.nation,
            images: {
              preview: updatedTank.images?.preview,
              normal: updatedTank.images?.normal
            },
            totalBattles: globalTank?.all.battles ?? 0,
            totalWins: globalTank?.all.wins ?? 0,
            totalWinRate: globalTank ? (globalTank?.all.wins / globalTank?.all.battles) * 100 : 0,
            totalAvgDamage: globalTank ? globalTank.all.damage_dealt / globalTank?.all.battles : 0,
            is_premium: globalTank?.is_premium ?? false,
            is_collectible: globalTank?.is_collectible ?? false,
          };
        }
      }
      return null;
    }).filter(delta => delta !== null);
  }

  handleError(error: any, contextMessage: string): void {
    const userFriendlyMessage = error.message || `${contextMessage}. Попробуйте снова.`;
    this.sessionState.sessionError.set(userFriendlyMessage);
    console.error(`[SessionActionsService] ${contextMessage}:`, error);
  }
}

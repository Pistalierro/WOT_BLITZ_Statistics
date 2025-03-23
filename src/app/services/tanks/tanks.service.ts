import {effect, inject, Injectable, signal} from '@angular/core';
import {
  BattlesByTier,
  BattlesByType,
  BattlesByWinAvgDamage,
  BattlesByWinRate,
  Tank,
  TankData
} from '../../models/tank/tanks-response.model';
import {SyncService} from '../../shared/services/data/sync.service';
import {TankProfile} from '../../models/tank/tank-full-info.model';
import {TanksDataService} from './tanks-data.service';
import {PlayerStoreService} from '../player/player-store.service';
import {WN8Service} from '../wn8.service';

@Injectable({providedIn: 'root'})
export class TanksService {

  tanksList = signal<Tank[]>([]);
  tankFullInfo = signal<TankProfile | null>(null);
  selectedTankData = signal<Tank | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  battlesByTier = signal<BattlesByTier>({});
  battlesByType = signal<BattlesByType>({});
  winRateByTier = signal<BattlesByWinRate>({});
  avgDamageByTier = signal<BattlesByWinAvgDamage>({});
  totalBattles = signal<number>(0);
  accountIdSignal = signal<number | null>(null);
  jsonTanksList: TankData[] = [];


  private syncService = inject(SyncService);
  private tanksDataService = inject(TanksDataService);
  private playerStoreService = inject(PlayerStoreService);
  private wn8Service = inject(WN8Service);

  constructor() {
    void this.initData();

    effect(() => {
      const accountId = this.playerStoreService.accountIdSignal();
      if (accountId) {
        queueMicrotask(() => {
          void this.getTanksData(accountId);
        });
      }
    });

    effect(() => {
      const tanksList = this.tanksList();
      if (tanksList.length > 0) {
        queueMicrotask(() => {
          this.calculateStatistics();
        });
      }
    });
  }

  async getTanksData(accountId: number): Promise<void> {
    if (!accountId) {
      this.error.set('⚠️ ID игрока отсутствует');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      let jsonTanksList: TankData[] = [];

      try {
        jsonTanksList = await this.tanksDataService.getJsonTanks();
      } catch (error: any) {
        console.error('❌ [TanksDataService] Ошибка получения jsonTanks:', error.message);
        jsonTanksList = [];
      }

      if (!jsonTanksList.length) {
        console.error('❌ [TanksDataService] jsonTanksList пуст, останавливаемся.');
        return;
      }

      const statsData = await this.tanksDataService.getPlayerTanksStats(accountId);
      if (!statsData.length) {
        console.warn('⚠ [TanksDataService] statsData пуст, не создаём mergedTanks.');
        return;
      }

      const mergedTanks: Tank[] = statsData
        .filter(tank => tank.all.battles > 0 && tank.all.damage_dealt)
        .map(stat => {
          const localTank = jsonTanksList.find(t => t.tank_id === stat.tank_id);

          const tank: Tank = {
            tank_id: stat.tank_id,
            name: localTank?.name ?? 'Unknown',
            nation: localTank?.nation ?? 'unknown',
            tier: localTank?.tier ?? 0,
            type: localTank?.type ?? 'unknown',
            mark_of_mastery: stat.mark_of_mastery ?? 0,
            last_battle_time: stat.last_battle_time ?? 0,
            is_premium: localTank?.is_premium ?? false,
            is_collectible: localTank?.is_collectible ?? false,
            images: {
              preview: localTank?.images?.normal || '/images/tanks/default_tank.webp',
              normal: localTank?.images?.normal || '/images/tanks/default_tank.webp',
            },
            all: {
              xp: stat.all?.xp ?? 0,
              battles: stat.all?.battles ?? 0,
              wins: stat.all?.wins ?? 0,
              losses: stat.all?.losses ?? 0,
              damage_dealt: stat.all?.damage_dealt ?? 0,
              max_frags: stat.all?.max_frags ?? 0,
              survived_battles: stat.all?.survived_battles ?? 0,
              frags: stat.all?.frags ?? 0,
              damage_received: stat.all?.damage_received ?? 0,
              shots: stat.all?.shots ?? 0,
              hits: stat.all?.hits ?? 0,
              spotted: stat.all?.spotted ?? 0,
              max_xp: stat.all?.max_xp ?? 0,
              dropped_capture_points: stat.all?.dropped_capture_points ?? 0,
            }
          };

          const wn8 = this.wn8Service.calculateWn8ForTank(tank);

          return {
            ...tank,
            all: {
              ...tank.all,
              wn8
            }
          };
        });


      if (!mergedTanks.length) {
        console.warn('⚠ [TanksDataService] mergedTanks пуст, не сохраняем в tanksList.');
        return;
      }

      this.tanksList.set(mergedTanks);
      await this.syncService.saveDataToAllStorages('tanks', 'playerTanksList', mergedTanks);
    } finally {
      this.loading.set(false);
    }
  }


  async getTanksProps(tankId: number): Promise<TankProfile | null> {
    try {
      const tankFullInfo = await this.tanksDataService.getTankProfile(tankId);
      if (!tankFullInfo) return null;

      await this.getSelectedTanksStatistics(tankId);

      this.tankFullInfo.set(tankFullInfo);
      console.log(tankFullInfo);
      await this.syncService.saveDataToAllStorages('tanks', 'tankFullInfo', tankFullInfo);

      return tankFullInfo;
    } catch (error: any) {
      console.error(`❌ [TanksService] Ошибка загрузки характеристик танка: ${error.message}`);
      return null;
    }
  }

  async getSelectedTanksStatistics(tankId: number): Promise<void> {
    try {
      const playerTankList = this.tanksList();

      if (!playerTankList) {
        console.log('❌ Отсутствует список танков у игрока');
        return;
      }

      const selectedTankStatistics = playerTankList.find(tank => tank.tank_id === tankId);

      if (!selectedTankStatistics) {
        console.log(`⚠️ Не найден танк с ID ${tankId}`);
        return;
      }
      console.log(selectedTankStatistics);

      this.selectedTankData.set(selectedTankStatistics);
      await this.syncService.saveDataToAllStorages('tanks', 'selectedTankStatistics', selectedTankStatistics);
    } catch (error: any) {
      console.error('❌ Ошибка получения данных выбранного танка:', error);
    }
  }

  async findMissingTanks(): Promise<void> {
    try {
      const apiTankIds = await this.tanksDataService.getAllTanksFromApi();
      let jsonTanksList = await this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks');
      jsonTanksList = Array.isArray(jsonTanksList) ? jsonTanksList : [];

      const missingTanks = jsonTanksList.filter(tank => tank.tier === 10 && !apiTankIds.has(tank.tank_id));

      console.log(`🚨 [TanksService] Найдено ${missingTanks.length} танков 10 уровня, отсутствующих в API Wargaming:`);
      console.table(missingTanks);
      await this.syncService.saveDataToAllStorages('tanks', 'missingTanksTier10', missingTanks);

    } catch (err: any) {
      console.error(`❌ [TanksService] Ошибка в findMissingTanks: ${err.message}`);
    }
  }

  private calculateStatistics(): void {
    const tanks: Tank[] = this.tanksList();

    const {battlesByTier, battlesByType, winsByTier, damageByTier} = tanks.reduce((acc, tank) => {
      const {tier, type, all} = tank;
      acc.battlesByTier[tier] = (acc.battlesByTier[tier] || 0) + all.battles;
      acc.battlesByType[type] = (acc.battlesByType[type] || 0) + all.battles;
      acc.winsByTier[tier] = (acc.winsByTier[tier] || 0) + all.wins;
      acc.damageByTier[tier] = (acc.damageByTier[tier] || 0) + all.damage_dealt;
      return acc;
    }, {
      battlesByTier: {} as BattlesByTier,
      battlesByType: {} as BattlesByType,
      winsByTier: {} as Record<number, number>,
      damageByTier: {} as Record<number, number>
    });

    for (let tier = 1; tier <= 10; tier++) {
      battlesByTier[tier] ??= 0;
    }

    const {winRateByTier, avgDamageByTier} = this.tanksDataService.calculateWinRateAndAvgDamage(
      battlesByTier,
      winsByTier,
      damageByTier
    );

    this.battlesByTier.set(battlesByTier);
    this.battlesByType.set(battlesByType);
    this.totalBattles.set(Object.values(battlesByTier).reduce((acc, count) => acc + count, 0));
    this.winRateByTier.set(winRateByTier);
    this.avgDamageByTier.set(avgDamageByTier);
  }

  private async initData(): Promise<void> {
    try {
      const [jsonTanksList, playerTanksList, tankFullInfo] = await Promise.all([
        this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks'),
        this.syncService.getDataFromAllStorages<Tank[]>('tanks', 'playerTanksList'),
        this.syncService.getDataFromAllStorages<TankProfile>('tanks', 'tankFullInfo'),
      ]);
      this.jsonTanksList = Array.isArray(jsonTanksList) ? jsonTanksList : [];
      this.tanksList.set(Array.isArray(playerTanksList) ? playerTanksList : []);
      this.tankFullInfo.set(tankFullInfo ?? null);

    } catch (error: any) {
      console.error('❌ Ошибка при инициализации данных:', error.message);
    }
  }
}

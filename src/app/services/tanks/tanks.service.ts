import {effect, inject, Injectable, signal} from '@angular/core';
import {
  BattlesByTier,
  BattlesByType,
  BattlesByWinAvgDamage,
  BattlesByWinRate,
  Tank,
  TankData
} from '../../models/tank/tanks-response.model';
import {PlayerStoreService} from '../player/player-store.service';
import {SyncService} from '../../shared/services/data/sync.service';
import {TankProfile} from '../../models/tank/tank-full-info.model';
import {TanksDataService} from './tanks-data.service';

@Injectable({providedIn: 'root'})

export class TanksService {
  tanksList = signal<Tank[]>([]);
  tankFullInfo = signal<TankProfile | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  battlesByTier = signal<BattlesByTier>({});
  battlesByType = signal<BattlesByType>({});
  winRateByTier = signal<BattlesByWinRate>({});
  avgDamageByTier = signal<BattlesByWinAvgDamage>({});
  totalBattles = signal<number>(0);
  jsonTanksList: TankData[] = [];

  private playerStore = inject(PlayerStoreService);
  private syncService = inject(SyncService);
  private tanksDataService = inject(TanksDataService);

  constructor() {
    void this.initData();
    effect(() => {
      const accountId = this.playerStore.accountIdSignal();
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
      let jsonTanksList = await this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks');
      jsonTanksList = Array.isArray(jsonTanksList) ? jsonTanksList : [];

      const statsData = await this.tanksDataService.getPlayerTanksStats(accountId);
      if (!statsData.length) {
        console.warn('⚠ [TanksDataService] statsData пуст, не создаём mergedTanks.');
        return;
      }

      const mergedTanks: Tank[] = statsData.map(stat => {
        const localTank = jsonTanksList.find(tank => tank.tank_id === stat.tank_id) || {} as TankData;

        return {
          tank_id: stat.tank_id,
          name: localTank.name ?? 'Unknown',
          nation: localTank.nation ?? 'unknown',
          tier: localTank.tier ?? 0,
          type: localTank.type ?? 'unknown',
          images: {
            preview: localTank.images?.normal || '/images/tanks/default_tank.webp',
            normal: localTank.images?.normal || '/images/tanks/default_tank.webp',
          },
          is_premium: localTank.is_premium ?? false,
          is_collectible: localTank.is_collectible ?? false,
          all: stat.all || {battles: 0, wins: 0, damage_dealt: 0, max_frags: 0},
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

      this.tankFullInfo.set(tankFullInfo);
      console.log('✅ [TanksService] Характеристики танка загружены:', tankFullInfo);
      await this.syncService.saveDataToAllStorages('tanks', 'tankFullInfo', tankFullInfo);

      return tankFullInfo;
    } catch (error: any) {
      console.error(`❌ [TanksService] Ошибка загрузки характеристик танка: ${error.message}`);
      return null;
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

      // 🔹 (Опционально) Сохраняем список отсутствующих танков 10 уровня в локальное хранилище
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

    const {winRateByTier, avgDamageByTier} = this.tanksDataService.calculateWinRateAndAvgDamage(battlesByTier, winsByTier, damageByTier);

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

      // ✅ Проверяем, что jsonTanksList действительно массив, иначе делаем []
      this.jsonTanksList = Array.isArray(jsonTanksList) ? jsonTanksList : [];

      // ✅ Проверяем, что playerTanksList не null перед установкой
      this.tanksList.set(Array.isArray(playerTanksList) ? playerTanksList : []);

      // ✅ Просто устанавливаем tankFullInfo, тут null - ок
      this.tankFullInfo.set(tankFullInfo ?? null);

    } catch (error: any) {
      console.error('❌ Ошибка при инициализации данных:', error.message);
    }
  }

}

import {effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../../app.config';
import {catchError, firstValueFrom, lastValueFrom, throwError} from 'rxjs';
import {
  BattlesByTier,
  BattlesByType,
  BattlesByWinAvgDamage,
  BattlesByWinRate,
  Tank,
  TankData,
  TankStatsResponse
} from '../../models/tank/tanks-response.model';
import {PlayerStoreService} from '../player/player-store.service';
import {SyncService} from '../../shared/services/data/sync.service';
import {ApiResponse, TankProfile} from '../../models/tank/tank-full-info.model';

const allTanksUrl = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=597472385`;


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
  private jsonTanksList: TankData[] = [];

  private http = inject(HttpClient);
  private playerStore = inject(PlayerStoreService);
  private syncService = inject(SyncService);

  constructor() {
    void this.initData();
    effect(() => {
      const accountId = this.playerStore.accountIdSignal();
      if (accountId) {
        queueMicrotask(() => {
          void this.fetchTankData(accountId);
        });
      }
    });

    effect(() => {
      if (this.tanksList().length > 0) {
        queueMicrotask(() => {
          void this.calculateStatistics();
        });
      }
    });
  }

  async fetchTankData(accountId: number) {
    if (!accountId) {
      this.error.set('⚠️ ID игрока отсутствует');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const jsonTanks = await this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks');
      this.jsonTanksList = Array.isArray(jsonTanks) ? jsonTanks : [];

      const filteredTanks = this.jsonTanksList
        .map(({tank_id, name, nation, tier, type, images, is_premium, is_collectible}) => ({
          tank_id,
          name: name ?? 'Unknown',
          nation: nation ?? 'unknown',
          tier: tier ?? 0,
          type: type ?? 'unknown',
          images: {
            preview: images?.normal || '/images/tanks/default_tank.webp',
            normal: images?.normal || '/images/tanks/default_tank.webp',
          },
          is_premium: is_premium ?? false,
          is_collectible: is_collectible ?? false,
        }));

      const fields = 'tank_id%2C+last_battle_time%2C+all.battles%2C+all.damage_dealt%2C+all.max_frags%2C+all.wins';
      const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&fields=${fields}`;

      const res = await lastValueFrom(
        this.http.get<TankStatsResponse>(url).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения данных о танках: ' + err.message)))
        )
      );

      if (res.status !== 'ok' || !res.data[accountId]) {
        this.error.set('❌ Ошибка: данные о танках отсутствуют');
        return;
      }

      const statsData = res.data[accountId];
      const tankStatsFiltered = statsData.filter(tank => tank.all.battles >= 0);

      const mergedTanks: Tank[] = tankStatsFiltered.map(stat => {
        const localTank = filteredTanks.find(tank => tank.tank_id === stat.tank_id) as Partial<TankData> || {};

        return {
          ...stat,
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
        };
      });
      this.tanksList.set(mergedTanks);
      await this.syncService.saveDataToAllStorages('tanks', 'jsonTanks', mergedTanks);
    } catch (err: any) {
      this.error.set(`⚠️ Ошибка загрузки данных о танках: ${err.message}`);
    } finally {
      this.loading.set(false);
    }
  }

  async getTanksProps(tankId: number): Promise<any> {
    try {
      const url = `${apiConfig.baseUrl}/encyclopedia/vehicleprofile/?application_id=${apiConfig.applicationId}&tank_id=${tankId}`;
      const res = await firstValueFrom(this.http.get<ApiResponse<TankProfile>>(url));

      if (res.status !== 'ok' || !res.data) {
        console.log('Ошибка получения характеристик танка');
      }

      this.tankFullInfo.set(res.data[tankId]);
      console.log(this.tankFullInfo());
    } catch (error: any) {
      console.log(error.message);
    }
  }

  async findMissingTanks(): Promise<void> {
    try {
      console.log('⏳ [findMissingTanks] Загружаем список танков из Wargaming API...');

      const url = `https://api.wotblitz.eu/wotb/encyclopedia/vehicles/?application_id=${apiConfig.applicationId}`;
      const res = await firstValueFrom(
        this.http.get<{ status: string; data: { [key: number]: { tank_id: number } } }>(url).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения данных о танках из Wargaming API: ' + err.message)))
        )
      );

      if (res.status !== 'ok' || !res.data) {
        console.warn('⚠️ [findMissingTanks] API Wargaming не вернул данные.');
        return;
      }

      const apiTankIds = new Set(Object.keys(res.data).map(Number)); // Список tank_id из API
      console.log(`📊 [findMissingTanks] Загружено танков из API: ${apiTankIds.size}`);

      // 2️⃣ Загружаем локальный JSON (BlitzStars)
      const jsonTanks = await this.syncService.getDataFromAllStorages('tanks', 'jsonTanks');
      const jsonTanksList = Array.isArray(jsonTanks) ? jsonTanks : [];

      console.log(`📥 [findMissingTanks] Загружено танков из локального JSON: ${jsonTanksList.length}`);

      // 3️⃣ Находим танки 10 уровня, которых нет в API, но есть в JSON
      const missingTanks = jsonTanksList.filter(tank => tank.tier === 10 && !apiTankIds.has(tank.tank_id));

      console.log(`🚨 [findMissingTanks] Найдено ${missingTanks.length} танков 10 уровня, отсутствующих в API Wargaming:`);
      console.table(missingTanks);

      // 4️⃣ (Опционально) Сохраняем список отсутствующих танков 10 уровня в локальное хранилище
      await this.syncService.saveDataToAllStorages('tanks', 'missingTanksTier10', missingTanks);

      console.log('✅ [findMissingTanks] Список отсутствующих танков 10 уровня сохранён.');
    } catch (err: any) {
      console.error(`❌ [findMissingTanks] Ошибка: ${err.message}`);
    }
  }

  private calculateStatistics(): void {
    const battlesByTier: BattlesByTier = {};
    const battlesByType: BattlesByType = {};
    const winRateByTier: Record<number, number> = {};
    const avgDamageByTier: Record<number, number> = {};
    const winsByTier: Record<number, number> = {};
    const damageByTier: Record<number, number> = {};
    const tanks: Tank[] = this.tanksList();

    tanks.forEach(tank => {
      const tier = tank.tier;
      const battles = tank.all.battles;
      const wins = tank.all.wins;
      const damage = tank.all.damage_dealt;
      const type = tank.type;

      battlesByTier[tier] = (battlesByTier[tier] || 0) + battles;
      battlesByType[type] = (battlesByType[type] || 0) + battles;
      winsByTier[tier] = (winsByTier[tier] || 0) + wins;
      damageByTier[tier] = (damageByTier[tier] || 0) + damage;
    });

    for (let tier = 1; tier <= 10; tier++) {
      if (!(tier in battlesByTier)) {
        battlesByTier[tier] = 0;
      }
    }

    Object.keys(battlesByTier).forEach(tier => {
      const tierNum = Number(tier);
      const totalBattles = battlesByTier[tierNum];

      winRateByTier[tierNum] = totalBattles > 0 ? (winsByTier[tierNum] / totalBattles) * 100 : 0;
      avgDamageByTier[tierNum] = totalBattles > 0 ? damageByTier[tierNum] / totalBattles : 0;
    });

    this.battlesByTier.set(battlesByTier);
    this.battlesByType.set(battlesByType);
    this.totalBattles.set(Object.values(battlesByTier).reduce((acc, count) => acc + count, 0));
    this.winRateByTier.set(winRateByTier);
    this.avgDamageByTier.set(avgDamageByTier);
  }

  private async initData(): Promise<void> {
    try {
      const [tanksList] = await Promise.all([
        this.syncService.getDataFromAllStorages<Tank[]>('tanks', 'jsonTanks'),
      ]);
      this.tanksList.set(tanksList);
    } catch (error: any) {
      console.error('❌ Ошибка при инициализации данных:', error.message);
    }
  }
}

import {effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, firstValueFrom, throwError} from 'rxjs';
import {BattlesByTier, BattlesByType, Tank, TankStatsResponse} from '../models/tank/tanks-response.model';
import {PlayerStoreService} from './player/player-store.service';


@Injectable({providedIn: 'root'})

export class TanksService {
  tanksList = signal<Tank[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  battlesByTier = signal<BattlesByTier>({});
  battlesByType = signal<BattlesByType>({});
  totalBattles = signal<number>(0);

  private http = inject(HttpClient);
  private playerStore = inject(PlayerStoreService);

  constructor() {
    effect(() => {
      const accountId = this.playerStore.accountIdSignal();
      if (accountId) {
        queueMicrotask(() => {
          this.fetchTankData(accountId).then();
        });
      }
    });
  }

  async fetchTankData(accountId: number) {
    if (!accountId) {
      this.error.set('ID игрока отсутствует');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&fields=tank_id%2C+last_battle_time%2C+all.battles%2C+all.damage_dealt%2C+all.max_frags%2C+all.wins`;
    try {
      const res = await firstValueFrom(
        this.http.get<TankStatsResponse>(url).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения данных о танках: ' + err.message)))
        )
      );

      if (res.status !== 'ok' || !res.data[accountId]) {
        this.error.set('Ошибка: данные о танках отсутствуют');
        return;
      }

      const statsData = res.data[accountId];
      const tankIds = statsData
        .filter(tank => tank.all.battles > 0)
        .map(tank => tank.tank_id);

      const tankProps = await this.fetchTanksProps(tankIds);
      const mergedTanks = statsData.map(stat => ({
        ...stat, ...tankProps[stat.tank_id],
      })).filter(tank => tank.name && tank.images && tank.nation && tank.tier && tank.type);
      this.tanksList.set(mergedTanks);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchTanksProps(tankIds: number[]) {
    const chunkSize = 100;
    const chunks = [];

    for (let i = 0; i < tankIds.length; i += chunkSize) {
      chunks.push(tankIds.slice(i, i + chunkSize));
    }

    try {
      const responses = await Promise.all(
        chunks.map(async chunk => {
          const chunkIds = chunk.join(',');
          const url = `${apiConfig.baseUrl}/encyclopedia/vehicles/?application_id=${apiConfig.applicationId}&fields=name%2C+images%2C+nation%2C+tier%2C+type&language=ru&tank_id=${chunkIds}`;
          const res = await firstValueFrom(
            this.http.get<{ status: string; data: { [key: number]: Tank } }>(url).pipe(
              catchError(err => throwError(() => new Error('Ошибка получения данных о свойствах танка')))
            )
          );

          if (!res || res.status !== 'ok') {
            throw new Error('Ошибка: данные о свойствах танков отсутствуют');
          }
          return res.data;
        })
      );

      return responses.reduce<{ [key: number]: Tank }>((acc, data) => ({...acc, ...data}), {});
    } catch (err: any) {
      this.error.set(err.message);
      return {};
    }
  }

  private calculateBattlesByTierAndType(): void {
    const battlesByTier: BattlesByTier = {};
    const battlesByType: BattlesByType = {};

    const tanks = this.tanksList(); // ✅ Получаем данные из сигнала перед перебором

    tanks.forEach(tank => {
      const tier = tank.tier;
      const battles = tank.all.battles;
      const type = tank.type;

      battlesByTier[tier] = (battlesByTier[tier] || 0) + battles;
      battlesByType[type] = (battlesByType[type] || 0) + battles;
    });

    this.battlesByTier.set(battlesByTier);
    this.battlesByType.set(battlesByType);
    this.totalBattles.set(Object.values(battlesByTier).reduce((acc, count) => acc + count, 0));
  }
}

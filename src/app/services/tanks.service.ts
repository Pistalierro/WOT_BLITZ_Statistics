import {effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, firstValueFrom, throwError} from 'rxjs';
import {TankStatsResponse} from '../models/tanks-response.model';
import {PlayerStoreService} from './player-store.service';

@Injectable({providedIn: 'root'})
export class TanksService {
  tanksIdList = signal<number[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private http = inject(HttpClient);
  private playerStore = inject(PlayerStoreService);

  constructor() {
    effect(() => {
      const accountId = this.playerStore.accountId();
      if (accountId) {
        // Мы делаем асинхронный вызов, чтобы сама запись в сигналы
        // происходила "не в теле эффекта".
        queueMicrotask(() => {
          this.fetchTankId(accountId);
        });
      }
    });
  }

  async fetchTankId(accountId: number) {
    if (!accountId) {
      this.error.set('ID игрока отсутствует');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&fields=tank_id%2C+last_battle_time%2C++all.battles%2C+all.damage_dealt%2C+all.max_frags%2C+all.wins`;
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

      const tanksIdList = res.data[accountId]
        .filter(tank => tank.all.battles > 0)
        .map(tank => tank.tank_id);
      this.tanksIdList.set(tanksIdList);

    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}

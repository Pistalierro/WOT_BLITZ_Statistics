import {effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, firstValueFrom, throwError} from 'rxjs';
import {PlayerStoreService} from './player/player-store.service';

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {

  achievementsSignal = signal<any [] | null>(null);
  maxSeriesSignal = signal<any [] | null>(null);

  loading = signal<boolean | null>(null);
  error = signal<string | null>(null);

  private playerStore = inject(PlayerStoreService);
  private http = inject(HttpClient);

  constructor() {
    effect(() => {
      const accountId = this.playerStore.accountIdSignal();
      if (accountId) {
        queueMicrotask(() => {
          this.fetchAchievements(accountId).then();
        });
      }
    });
  }

  async fetchAchievements(accountId: number) {
    this.loading.set(true);
    this.error.set(null);

    const url = `${apiConfig.baseUrl}/account/achievements/?application_id=${apiConfig.applicationId}&account_id=${accountId}&language=ru`;

    try {
      const res: any = await firstValueFrom(
        this.http.get(url).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения данных о наградах: ' + err.message)))
        )
      );

      if (res.status !== 'ok' || !res.data[accountId]) {
        this.error.set('Ошибка: данные о наградах отсутствуют');
        this.loading.set(false);
        return;
      }

      const achievementsData = res.data[accountId];
      const mergedData = this.mergeAchievementsAndSeries(
        achievementsData.achievements,
        achievementsData.max_series
      );
      const uniqueAchievements = this.filterUniqueAchievements(mergedData);
      this.achievementsSignal.set(uniqueAchievements);

      console.log(this.achievementsSignal());

    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }


  private mergeAchievementsAndSeries(
    achievements: Record<string, any>,
    maxSeries: Record<string, any>
  ): any[] {
    const achievementsArray = Object.entries(achievements).map(([key, value]) => ({
      key,
      type: 'achievement',
      value, // Текущее значение награды
    }));

    const maxSeriesArray = Object.entries(maxSeries).map(([key, value]) => ({
      key,
      type: 'max_series',
      value, // Максимальная серия
    }));

    return [...achievementsArray, ...maxSeriesArray];
  }

  private filterUniqueAchievements(data: any[]): any[] {
    const uniqueMap = new Map<string, any>();

    data.forEach((item) => {
      // Если ключ уже существует и новый элемент имеет тип max_series, заменяем
      if (!uniqueMap.has(item.key) || item.type === 'max_series') {
        uniqueMap.set(item.key, item);
      }
    });

    // Возвращаем массив уникальных достижений
    return Array.from(uniqueMap.values());
  }

}

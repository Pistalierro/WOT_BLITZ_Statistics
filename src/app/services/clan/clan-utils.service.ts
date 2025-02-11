import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../../app.config';
import {lastValueFrom, timeout} from 'rxjs';
import {PlayerData} from '../../models/player/player-response.model';
import {ApiResponse} from '../../models/clan/clan-response.model';

@Injectable({
  providedIn: 'root'
})
export class ClanUtilsService {

  private http = inject(HttpClient);

  async getClanWinRate(membersIds: number[]): Promise<number> {
    if (!Array.isArray(membersIds) || membersIds.length === 0) {
      console.warn('⚠ Список участников клана пуст или не является массивом, возвращаю 0');
      return 0;
    }

    try {
      const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${membersIds.join(',')}&fields=statistics.all.battles,statistics.all.wins`;

      const res: any = await lastValueFrom(this.http.get(url));
      if (!res || !res.data) {
        console.warn('⚠ Пустой ответ API для списка игроков, возвращаю 0');
        return 0;
      }

      const rawData = Object.values(res.data) as PlayerData[];

      if (!rawData.length) {
        console.warn('⚠ Не пришли данные ни по одному игроку, возвращаю 0');
        return 0;
      }


      const validMembers = rawData.filter((member: PlayerData) => {
        if (!member) {
          console.warn('⚠ Один из игроков оказался null или undefined');
          return false;
        }

        if (!member.statistics) {
          console.warn('⚠ Игрок без поля "statistics" — пропускаем');
          return false;
        }

        if (!member.statistics.all) {
          console.warn('⚠ Игрок без поля "statistics.all" — пропускаем');
          return false;
        }

        return true;
      });

      if (!validMembers.length) {
        console.warn('⚠ Все участники оказались с битой статистикой, возвращаю 0');
        return 0;
      }

      let totalWins = 0;
      let totalBattles = 0;

      for (const member of validMembers) {
        const battles = member.statistics.all.battles || 0;
        const wins = member.statistics.all.wins || 0;


        totalBattles += battles;
        totalWins += wins;
      }

      if (totalBattles <= 0) {
        console.warn('⚠ Ноль боёв у всех, winRate = 0');
        return 0;
      }

      return (totalWins / totalBattles) * 100;

    } catch (err: any) {
      console.error('❌ Ошибка при вычислении winRate:', err.message);
      return 0;
    }
  }

  async fetchPaginatedData<T, R>(
    urlGenerator: (page: number) => string,
    totalPages: number,
    processResponse: (response: ApiResponse<T>) => R[],
    batchSize: number = 10,        // ✅ Значение по умолчанию, можно не передавать
    requestTimeout: number = 5000  // ✅ Таймаут тоже дефолтный
  ): Promise<R[]> {
    const allData: R[] = [];

    try {
      let pagesLoaded = 0;

      for (let i = 1; i <= totalPages; i += batchSize) {
        const batchRequests: Promise<ApiResponse<T>>[] = [];

        for (let j = 0; j < batchSize && i + j <= totalPages; j++) {
          const url = urlGenerator(i + j);
          batchRequests.push(
            lastValueFrom(this.http.get<ApiResponse<T>>(url).pipe(timeout(requestTimeout)))
          );
        }

        const batchResponses = await Promise.allSettled(batchRequests);

        batchResponses.forEach(result => {
          if (result.status === 'fulfilled') {
            allData.push(...processResponse(result.value)); // ✅ Теперь `R[]` может быть `number[]` или `ClanListEntry[]`
          } else {
            console.warn(`⚠️ Ошибка при загрузке страницы:`, result.reason);
          }
        });

        pagesLoaded += batchResponses.length;
        const progressPercent = ((pagesLoaded / totalPages) * 100).toFixed(2);
        console.log(`✅ Загружено страниц: ${i}-${Math.min(i + batchSize - 1, totalPages)} | 📊 Прогресс: ${progressPercent}%`);
        await this.delay(1000);
      }
    } catch (err: any) {
      console.error('❌ Ошибка загрузки данных:', err.message);
    }

    return allData;
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

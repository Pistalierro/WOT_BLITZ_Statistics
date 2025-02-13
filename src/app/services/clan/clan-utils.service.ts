import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../../app.config';
import {lastValueFrom, timeout} from 'rxjs';
import {PlayerData} from '../../models/player/player-response.model';
import {ApiResponse} from '../../models/clan/clan-response.model';
import {ClanFirestoreService} from './clan-firestore.service';

@Injectable({
  providedIn: 'root'
})
export class ClanUtilsService {

  private http = inject(HttpClient);
  private firestoreService = inject(ClanFirestoreService);

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

  async loadDataWithFallback<T extends any[]>(key: string, stateRef: T, maxAgeMinutes: number = 30): Promise<T> {
    const localData = this.loadFromStorage<T>(key, maxAgeMinutes);
    if (localData && localData.length > 0) {
      return localData;
    }

    console.warn(`⚠ '${key}' отсутствует в localStorage или устарело, загружаем из Firestore...`);
    const firestoreData = await this.firestoreService.loadCollection<T>(key);

    if (firestoreData && firestoreData.length > 0) {
      this.saveToStorage(key, firestoreData);
      return firestoreData;
    }

    console.warn(`⚠ '${key}' не найден ни в localStorage, ни в Firestore. Возвращаем пустой массив.`);
    return [] as unknown as T;
  }

  saveToStorage<T>(key: string, data: T): void {
    const timestamp = Date.now();
    const storedData = {data, timestamp};
    localStorage.setItem(key, JSON.stringify(storedData));
  }

  loadFromStorage<T>(key: string, maxAgeMinutes: number = 30): T | null {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      const {data, timestamp} = JSON.parse(stored);
      const elapsedMinutes = (Date.now() - timestamp) / 60000;

      if (elapsedMinutes < maxAgeMinutes) {
        console.log(`✅ '${key}' загружен из localStorage (данные свежие, ${elapsedMinutes.toFixed(1)} мин назад)`);
        return data;
      } else {
        console.warn(`⚠ '${key}' устарело (${elapsedMinutes.toFixed(1)} мин назад), удаляем из localStorage...`);
        localStorage.removeItem(key);  // ❗ Удаляем устаревшие данные
        return null;
      }
    } catch (error) {
      console.error(`❌ Ошибка при разборе данных из localStorage:`, error);
      return null;
    }
  }

  chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({length: Math.ceil(array.length / size)}, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}



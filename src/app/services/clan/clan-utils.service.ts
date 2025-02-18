import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../../app.config';
import {lastValueFrom, timeout} from 'rxjs';
import {PlayerInfoResponse} from '../../models/player/player-response.model';
import {ApiResponse} from '../../models/clan/clan-response.model';
import {ClanFirestoreService} from './clan-firestore.service';
import {ClanIndexedDbService} from './clan-indexeddb.service';

@Injectable({
  providedIn: 'root'
})
export class ClanUtilsService {

  private http = inject(HttpClient);
  private firestoreService = inject(ClanFirestoreService);
  private indexedDbService = inject(ClanIndexedDbService);

  async getClanStats(membersIds: number[]): Promise<{ winRate: number, avgDamage: number }> {
    if (!Array.isArray(membersIds) || membersIds.length === 0) {
      console.warn('⚠ Список участников клана пуст или не является массивом, возвращаю 0');
      return {winRate: 0, avgDamage: 0};
    }

    try {
      const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${membersIds.join(',')}&fields=statistics.all.battles,statistics.all.wins`;
      const res = await lastValueFrom(this.http.get<PlayerInfoResponse>(url));
      if (!res || res.status !== 'ok' || !res.data) {
        console.warn('⚠ Пустой ответ API для списка игроков, возвращаю 0');
        return {winRate: 0, avgDamage: 0};
      }
      const rawData = Object.values(res.data);

      if (!rawData.length) {
        console.warn('⚠ Не пришли данные ни по одному игроку, возвращаю 0');
        return {winRate: 0, avgDamage: 0};
      }

      const validMembers = rawData.filter(player => {
        player?.statistics?.all?.battles &&
        player?.statistics?.all?.wins &&
        player?.statistics?.all?.damage_dealt;
      });

      if (!validMembers.length) {
        console.warn('⚠ Все участники оказались с битой статистикой, возвращаю 0');
        return {winRate: 0, avgDamage: 0};
      }

      let totalWins = 0;
      let totalBattles = 0;
      let totalDamageDealt = 0;

      for (const player of validMembers) {
        const battles = player.statistics.all.battles || 0;
        const wins = player.statistics.all.wins || 0;
        const damageDealt = player.statistics.all.damage_dealt;

        totalBattles += battles;
        totalWins += wins;
        totalDamageDealt += damageDealt;
      }

      if (totalBattles <= 0) {
        console.warn('⚠ Ноль боёв у всех, winRate = 0, avgDamage = 0');
        return {winRate: 0, avgDamage: 0};
      }
      const winRate = (totalWins / totalBattles) * 100;
      const avgDamage = totalDamageDealt / totalBattles;

      return {winRate, avgDamage};

    } catch (err: any) {
      console.error('❌ Ошибка при вычислении winRate:', err.message);
      return {winRate: 0, avgDamage: 0};
    }
  }

  async fetchPaginatedData<T, R>(
    urlGenerator: (page: number) => string,
    totalPages: number,
    processResponse: (response: ApiResponse<T>) => R[],
    batchSize: number = 10,        // ✅ Значение по умолчанию, можно не передавать
    requestTimeout: number = 2000  // ✅ Таймаут тоже дефолтный
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
        // console.clear();
        console.log(`✅ Загружено страниц: ${i}-${Math.min(i + batchSize - 1, totalPages)} | 📊 Прогресс: ${progressPercent}%`);
        await this.delay(500);
      }
    } catch (err: any) {
      console.error('❌ Ошибка загрузки данных:', err.message);
    }

    return allData;
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async loadDataWithFallback<T extends any[]>(key: string, maxAgeMinutes: number = 30): Promise<T> {
    try {
      const record = await this.indexedDbService.getRecord(key);
      if (record && record.data) {
        const fresh = this.isFresh(record.timestamp, maxAgeMinutes);
        if (fresh) {
          console.log(`✅ '${key}' загружен из IndexedDB (данные свежие)`);
          return record.data as T;
        } else {
          console.warn(`⚠ '${key}' устарело (более ${maxAgeMinutes} минут), удаляем из IndexedDB...`);
          await this.indexedDbService.removeRecord(key);
        }
      }
      console.warn(`⚠ '${key}' отсутствует в IndexedDB или устарело, загружаем из Firestore...`);
      const firestoreData = await this.firestoreService.loadCollection<T>(key);
      if (firestoreData && firestoreData.length > 0) {
        await this.indexedDbService.putRecord(key, firestoreData);
        return firestoreData;
      }

      console.warn(`⚠ '${key}' не найден ни в IndexedDB, ни в Firestore. Возвращаем пустой массив.`);
      return [] as unknown as T;
    } catch (err: any) {
      console.error(`❌ Ошибка в loadDataWithFallback('${key}'):`, err);
      return [] as unknown as T;
    }
  }

  async saveDataToIndexedDb<T>(key: string, data: T): Promise<void> {
    await this.indexedDbService.putRecord(key, data);
  }

  chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({length: Math.ceil(array.length / size)}, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  private isFresh(timestamp: number, maxAgeMinutes: number): boolean {
    const elapsedMinutes = (Date.now() - timestamp) / 60000;
    return elapsedMinutes < maxAgeMinutes;
  }
}



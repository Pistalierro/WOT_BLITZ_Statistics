import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../../app.config';
import {lastValueFrom, timeout} from 'rxjs';
import {PlayerInfoResponse} from '../../models/player/player-response.model';
import {ApiResponse, BasicClanData} from '../../models/clan/clan-response.model';
import {ClanFirestoreService} from './clan-firestore.service';
import {ClanIndexedDbService} from './clan-indexeddb.service';

@Injectable({
  providedIn: 'root'
})
export class ClanUtilsService {

  private http = inject(HttpClient);
  private firestoreService = inject(ClanFirestoreService);
  private indexedDbService = inject(ClanIndexedDbService);

  async getClanStats(membersIds: number[]): Promise<{ winRate: number; avgDamage: number }> {
    if (!Array.isArray(membersIds) || membersIds.length === 0) {
      console.warn('⚠ Список участников клана пуст, возвращаю 0');
      return {winRate: 0, avgDamage: 0};
    }

    try {
      const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${membersIds.join(',')}&fields=statistics.all.battles,statistics.all.wins,statistics.all.damage_dealt`;
      const res = await lastValueFrom(this.http.get<PlayerInfoResponse>(url));

      if (!res || res.status !== 'ok' || !res.data) {
        console.warn('⚠ Пустой ответ API, возвращаю 0');
        return {winRate: 0, avgDamage: 0};
      }

      const rawData = Object.values(res.data);

      if (!rawData.length) {
        console.warn('⚠ API не вернул статистику ни по одному игроку.');
        return {winRate: 0, avgDamage: 0};
      }

      let totalWins = 0;
      let totalBattles = 0;
      let totalDamageDealt = 0;

      for (const player of rawData) {
        if (!player.statistics?.all) {
          console.warn(`⚠ Игрок ${player.nickname} (${player.account_id}) без статистики, пропускаем.`);
          continue;
        }

        const battles = player.statistics.all.battles || 0;
        const wins = player.statistics.all.wins || 0;
        const damageDealt = player.statistics.all.damage_dealt || 0;

        totalBattles += battles;
        totalWins += wins;
        totalDamageDealt += damageDealt;
      }

      if (totalBattles === 0) {
        console.warn('⚠ У всех игроков 0 боёв, winRate = 0, avgDamage = 0');
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
    batchSize: number = 10,
    requestTimeout: number = 2000,
    maxRetries: number = 5, // ✅ Добавляем ретраи
    retryDelay: number = 1000 // ✅ Начальная задержка перед ретраем
  ): Promise<R[]> {
    const allData: R[] = [];
    let pagesLoaded = 0;

    try {
      for (let i = 1; i <= totalPages; i += batchSize) {
        const batchRequests = Array.from({length: Math.min(batchSize, totalPages - i + 1)}, (_, j) => {
          const url = urlGenerator(i + j);
          return this.retryRequest<ApiResponse<T>>(url, maxRetries, retryDelay, requestTimeout);
        });

        const batchResponses = await Promise.allSettled(batchRequests);

        batchResponses.forEach(result => {
          if (result.status === 'fulfilled') {
            allData.push(...processResponse(result.value));
          } else {
            console.warn(`⚠️ Ошибка при загрузке страницы (превышено количество попыток):`, result.reason);
          }
        });

        pagesLoaded += batchResponses.length;
        console.log(`✅ Прогресс: ${(pagesLoaded / totalPages * 100).toFixed(2)}%`);
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

  async saveClansData(key: string, data: BasicClanData[]): Promise<void> {
    try {
      await Promise.all([
        this.indexedDbService.putClans(data),  // ✅ Сохраняем в IndexedDB
        this.firestoreService.saveData(key, data)  // ✅ Сохраняем в Firestore
      ]);
      console.log(`✅ Данные кланов сохранены в IndexedDB и Firestore (ключ: ${key})`);
    } catch (error) {
      console.error(`❌ Ошибка сохранения данных кланов:`, error);
    }
  }

  private async retryRequest<T>(url: string, maxRetries: number, retryDelay: number, requestTimeout: number): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // console.log(`🔄 Запрос ${url} (Попытка ${attempt + 1}/${maxRetries})`);
        return await lastValueFrom(this.http.get<T>(url).pipe(timeout(requestTimeout)));
      } catch (error: any) {
        console.warn(`⚠️ Ошибка запроса ${url} (Попытка ${attempt + 1}):`, error.message);

        if (attempt < maxRetries - 1) {
          const waitTime = retryDelay * Math.pow(2, attempt);
          console.log(`⏳ Ожидание ${waitTime / 1000}с перед повторной попыткой...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw new Error(`❌ Превышено количество попыток запроса: ${url}`);
        }
      }

      attempt++;
    }

    throw new Error(`❌ Ошибка запроса: ${url}`);
  }

  private isFresh(timestamp: number, maxAgeMinutes: number): boolean {
    const elapsedMinutes = (Date.now() - timestamp) / 60000;
    return elapsedMinutes < maxAgeMinutes;
  }
}

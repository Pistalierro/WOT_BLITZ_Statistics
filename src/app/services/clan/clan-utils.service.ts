import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {lastValueFrom, timeout} from 'rxjs';
import {ApiResponse, BasicClanData} from '../../models/clan/clan-response.model';
import {ClanIndexedDbService} from './clan-indexeddb.service';
import {apiConfig} from '../../app.config';
import {PlayerData} from '../../models/player/player-response.model';

@Injectable({
  providedIn: 'root'
})
export class ClanUtilsService {

  private http = inject(HttpClient);
  private indexedDbService = inject(ClanIndexedDbService);

  async fetchPaginatedData<T, R>(
    urlGenerator: (page: number) => string,
    totalPages: number,
    processResponse: (response: ApiResponse<T>) => R[],
    batchSize: number = 10,
    requestTimeout: number = 2000,
    maxRetries: number = 3,
    retryDelay: number = 1000
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

  async getClansStats(membersIds: number[], includeZeroBattles = false): Promise<{
    winRate: number, avgDamage: number, zeroBattlesCount?: number;
  }> {
    if (!Array.isArray(membersIds) || membersIds.length === 0) {
      console.warn('⚠ Список участников клана пуст или не является массивом, возвращаю 0');
      return includeZeroBattles ? {winRate: 0, avgDamage: 0, zeroBattlesCount: 0} : {winRate: 0, avgDamage: 0};
    }

    const fields = 'statistics.all.battles,statistics.all.wins,statistics.all.damage_dealt';
    const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${membersIds.join(',')}&fields=${fields}`;

    try {
      const res: any = await lastValueFrom(this.http.get(url));

      if (!res || res.status !== 'ok' || !res.data) {
        console.warn('⚠ Пустой ответ API, возвращаю 0');
        return includeZeroBattles ? {winRate: 0, avgDamage: 0, zeroBattlesCount: 0} : {winRate: 0, avgDamage: 0};
      }

      const rawData = Object.values(res.data) as PlayerData[];
      if (!rawData.length) {
        console.warn('⚠ API не вернул статистику ни по одному игроку.');
        return includeZeroBattles ? {winRate: 0, avgDamage: 0, zeroBattlesCount: 0} : {winRate: 0, avgDamage: 0};
      }

      let totalWins = 0;
      let totalBattles = 0;
      let totalDamageDealt = 0;
      let zeroBattlesCount = 0;

      for (const member of rawData) {
        const battles = member?.statistics?.all?.battles ?? 0;
        const wins = member?.statistics?.all?.wins ?? 0;
        const damageDealt = member?.statistics?.all?.damage_dealt ?? 0;

        totalWins += wins;
        totalBattles += battles;
        totalDamageDealt += damageDealt;

        if (battles === 0) {
          zeroBattlesCount++;
        }
      }

      const winRate = totalBattles > 0 ? (totalWins / totalBattles) * 100 : 0;
      const avgDamage = totalBattles > 0 ? totalDamageDealt / totalBattles : 0;

      return includeZeroBattles ? {winRate, avgDamage, zeroBattlesCount} : {winRate, avgDamage};
    } catch (error: any) {
      console.error('❌ Ошибка при вычислении статистики клана:', error.message);
      return includeZeroBattles ? {winRate: 0, avgDamage: 0, zeroBattlesCount: 0} : {winRate: 0, avgDamage: 0};
    }
  }

  async suggestClans(searchTerm: string): Promise<BasicClanData[]> {
    console.log(`🔎 Поиск в IndexedDB: "${searchTerm}"`);

    const lowerSearch = searchTerm.normalize('NFD').toLowerCase();
    const uniqueClans = new Map<number, BasicClanData>();
    const result: BasicClanData[] = [];

    const record = await this.indexedDbService.getRecord('allClansData');
    const allClans: BasicClanData[] = record?.data || [];

    if (!allClans.length) {
      console.error('❌ Кланы не найдены в `keyValue`');
      return [];
    }

    for (const clan of allClans) {
      if (result.length >= 20) break;
      const tag = clan.tag.normalize('NFD').toLowerCase();
      if (tag === lowerSearch) {
        uniqueClans.set(clan.clan_id, clan);
        result.push(clan);
      }
    }

    for (const clan of allClans) {
      if (result.length >= 20) break;
      const tag = clan.tag.normalize('NFD').toLowerCase();
      if (tag.startsWith(lowerSearch) && !uniqueClans.has(clan.clan_id)) {
        uniqueClans.set(clan.clan_id, clan);
        result.push(clan);
      }
    }

    for (const clan of allClans) {
      if (result.length >= 20) break;
      const name = clan.name.normalize('NFD').toLowerCase();
      if (name.startsWith(lowerSearch) && !uniqueClans.has(clan.clan_id)) {
        uniqueClans.set(clan.clan_id, clan);
        result.push(clan);
      }
    }

    return result;
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
}

import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BasicClanData, ClanDetails, ClanInfoResponse, ExtendedClanDetails} from '../../models/clan/clan-response.model';
import {firstValueFrom, lastValueFrom} from 'rxjs';
import {apiConfig} from '../../app.config';
import {ClanUtilsService} from './clan-utils.service';
import {ClanFirestoreService} from './clan-firestore.service';
import {ClanIndexedDbService} from './clan-indexeddb.service';
import {ClanDataService} from './clan-data.service';


@Injectable({
  providedIn: 'root'
})
export class ClanService {
  loading = signal<boolean>(false); // Состояние загрузки
  error = signal<string | null>(null); // Ошибки
  allClansData: BasicClanData[] = [];
  largeClansIds: BasicClanData[] = [];
  topClanIds: number[] = [];
  topClanDetails = signal<ExtendedClanDetails [] | null>(null);
  totalPages = 0;
  totalClans = 0;
  clanDetails = signal<ExtendedClanDetails | null>(null);
  private http = inject(HttpClient);
  private limit = 100;
  private clanUtilsService = inject(ClanUtilsService);
  private firestoreService = inject(ClanFirestoreService);
  private indexedDbService = inject(ClanIndexedDbService);
  private clanDataService = inject(ClanDataService);

  constructor() {
    void this.initData();
  }

  async getAllClansData(): Promise<void> {
    console.log('📌 Запуск загрузки всех кланов через ClanDataService');

    this.loading.set(true);
    this.error.set(null);

    try {
      const allClans = await this.clanDataService.fetchAllClans(100);
      if (!allClans.length) {
        throw new Error('❌ Загруженные данные о кланах пусты!');
      }

      const largeClans = allClans.filter(clan => clan.members_count >= 20);

      console.log(`✅ Всего загружено кланов: ${allClans.length}`);
      console.log(`📌 Кланы с 20+ участниками: ${largeClans.length}`);

      this.allClansData = allClans;
      this.largeClansIds = largeClans;

      await this.indexedDbService.clearAllClans();
      await Promise.all([
        this.clanUtilsService.saveClansData('allClansData', allClans),
        this.clanUtilsService.saveClansData('largeClansIds', largeClans),
      ]);

      console.log('✅ Данные успешно сохранены в IndexedDB и Firestore');
    } catch (error: any) {
      this.error.set(error.message);
      console.error('❌ Ошибка при загрузке всех кланов:', error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClansIds(): Promise<void> {
    this.topClanIds = [];
    if (!this.largeClansIds || !Array.isArray(this.largeClansIds) || !this.largeClansIds.length) {
      console.warn('⚠ Нет сохранённых данных больших кланов!');
      return;
    }

    if (!this.totalPages || this.totalPages <= 0) {
      this.totalPages = Math.ceil(this.largeClansIds.length / this.limit);
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const allClans = await this.clanUtilsService.fetchPaginatedData<ClanDetails, ExtendedClanDetails>(
        (page) => {
          const chunkStart = (page - 1) * this.limit;
          const chunkIds = this.largeClansIds.slice(chunkStart, chunkStart + this.limit);
          return `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${chunkIds.join(',')}`;
        },
        this.totalPages,
        (response) => {
          const result: ExtendedClanDetails[] = [];

          if (response.status === 'ok' && response.data) {
            for (const clanId in response.data) {
              const clanData = response.data[clanId];
              if (!clanData) {
                console.warn(`⚠ Нет данных по клану с ID ${clanId} — пропускаю`);
                continue;
              }
              result.push({...clanData, winRate: 0} as ExtendedClanDetails);
            }
          }
          return result;
        }
      );

      if (!allClans || !Array.isArray(allClans) || !allClans.length) {
        console.warn('⚠ Не удалось получить информацию ни по одному клану, выход');
        return;
      }

      const batchSize = 20;
      for (let i = 0; i < allClans.length; i += batchSize) {
        const batch = allClans.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (clan) => {
            const stats = await this.clanUtilsService.getClanStats(clan.members_ids);
            clan.winRate = stats.winRate;
            clan.avgDamage = stats.avgDamage;
          })
        );
        if ((i / batchSize) % 5 === 0) {
          console.log(`✅ Обработано ${Math.min(i + batchSize, allClans.length)} из ${allClans.length}`);
        }
      }

      const filteredClans = allClans.filter(clan =>
        clan &&
        typeof clan.clan_id === 'number' &&
        clan.clan_id > 0 &&
        typeof clan.winRate === 'number' &&
        clan.winRate > 0 &&
        clan.winRate < 80
      );

      if (!filteredClans.length) {
        console.warn('⚠ После фильтрации по winRate > 0 нет кланов');
        this.topClanIds = [];
        return;
      }

      filteredClans.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
      const top50 = filteredClans.slice(0, 50);

      // Сохраняем IDs в topClanIds
      this.topClanIds = top50.map(clan => clan.clan_id);
      console.log(this.topClanIds);

      // Кладём в локальное хранилище и Firestore
      await this.clanUtilsService.saveDataToIndexedDb('topClanIds', this.topClanIds);
      await this.firestoreService.saveData('topClanIds', this.topClanIds);

    } catch (err: any) {
      console.error('❌ Ошибка в getTopClansIds:', err);
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClanDetails(): Promise<void> {
    if (!this.topClanIds.length) {
      this.topClanIds = await this.clanUtilsService.loadDataWithFallback<number[]>('topClanIds');
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const cachedData = await this.clanUtilsService.loadDataWithFallback<ExtendedClanDetails[]>('topClanDetails',);
      if (cachedData.length > 0) {
        console.log('✅ Загружены топ-кланы из кеша');
        this.topClanDetails.set(cachedData);
        return;
      }

      const batchSize = 10;
      const batches = this.clanUtilsService.chunkArray(this.topClanIds, batchSize);

      const extendedClans: ExtendedClanDetails[] = [];

      for (const batch of batches) {
        const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${batch.join(',')}`;
        const res = await lastValueFrom(this.http.get<ClanInfoResponse>(url));

        if (!res || !res.data) {
          console.warn(`⚠ API не вернул данные о кланах в батче: ${batch}`);
          continue;
        }

        const clanList = Object.values(res.data) as ClanDetails[];
        const batchResults = await Promise.all(
          clanList.map(async (clan) => {
            const stats = await this.clanUtilsService.getClanStats(clan.members_ids);
            return {...clan, winRate: stats.winRate, avgDamage: stats.avgDamage};
          })
        );
        extendedClans.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
        extendedClans.push(...batchResults);

        this.topClanDetails.set([...extendedClans]);
      }

      await this.clanUtilsService.saveDataToIndexedDb('topClanDetails', extendedClans);
      await this.firestoreService.saveData('topClanDetails', extendedClans);
    } catch (error: any) {
      this.error.set(error.message);
      console.error('❌ Ошибка при получении данных о кланах:', error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getClanDetailsById(clanId: number): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
      const res = await firstValueFrom(this.http.get<ClanInfoResponse>(url));

      if (!res || !res.data || !res.data[clanId]) {
        console.warn(`⚠ API не вернул данные о клане с ID: ${clanId}`);
        this.error.set('Данные о клане не найдены.');
        return;
      }

      const clan = res.data[clanId];
      const stats = await this.clanUtilsService.getClanStats(clan.members_ids);

      this.clanDetails.set({...clan, winRate: stats.winRate, avgDamage: stats.avgDamage,});
    } catch (error: any) {
      console.error(`❌ Ошибка при получении данных о клане ${clanId}:`, error);
      this.error.set('Ошибка загрузки данных о клане.');
    } finally {
      this.loading.set(false);
    }
  }

  async getClanDetailsByNameOrTag(name: string): Promise<number | null> {
    try {
      const search = name.trim();
      if (!search) return null;

      const results = await this.indexedDbService.findClansByNameOrTag(search);
      if (!results || results.length === 0) {
        console.warn(`Нет кланов с именем "${search}"`);
        return null;
      }

      return results[0].clan_id;
    } catch (err: any) {
      console.error('Ошибка поиска кланов по имени:', err);
      return null;
    }
  }

  async suggestClans(searchTerm: string): Promise<BasicClanData[]> {
    const record = await this.indexedDbService.getRecord('allClansData');
    if (!record?.data) {
      console.warn('⚠ Данные о кланах отсутствуют в keyValue!');
      return [];
    }

    const lowerSearch = searchTerm.normalize('NFD').toLowerCase();
    const uniqueClans = new Map<number, BasicClanData>();
    const result: BasicClanData[] = [];

    for (const clan of record.data) {
      if (result.length >= 20) break;
      const tag = clan.tag.normalize('NFD').toLowerCase();
      if (tag === lowerSearch) {
        uniqueClans.set(clan.clan_id, clan);
        result.push(clan);
      }
    }

    for (const clan of record.data) {
      if (result.length >= 20) break;
      const tag = clan.tag.normalize('NFD').toLowerCase();
      if (tag.startsWith(lowerSearch) && !uniqueClans.has(clan.clan_id)) {
        uniqueClans.set(clan.clan_id, clan);
        result.push(clan);
      }
    }

    for (const clan of record.data) {
      if (result.length >= 20) break;
      const name = clan.name.normalize('NFD').toLowerCase();
      if (name.startsWith(lowerSearch) && !uniqueClans.has(clan.clan_id)) {
        uniqueClans.set(clan.clan_id, clan);
        result.push(clan);
      }
    }
    return result;
  }

  async initData(): Promise<void> {
    this.allClansData = await this.clanUtilsService.loadDataWithFallback<BasicClanData[]>('allClansData');
    this.largeClansIds = await this.clanUtilsService.loadDataWithFallback<BasicClanData[]>('largeClansIds');
    this.topClanIds = await this.clanUtilsService.loadDataWithFallback<number[]>('topClanIds');

    this.firestoreService.loadCollection<ExtendedClanDetails[]>('topClanDetails')
      .then(firestoreData => {
        if (firestoreData && firestoreData.length > 0) {
          this.topClanDetails.set(firestoreData);
        } else {
          console.warn('⚠ В Firestore нет `topClanDetails`');
        }
      })
      .catch(error => {
        console.error('❌ Ошибка при загрузке `topClanDetails` из Firestore:', error.message);
        this.error.set(error.message);
      });
  }
}

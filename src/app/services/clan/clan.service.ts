import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ClanDetails, ClanInfoResponse, ClanListEntry, ClanListResponse, ExtendedClanDetails} from '../../models/clan/clan-response.model';
import {firstValueFrom, lastValueFrom} from 'rxjs';
import {apiConfig} from '../../app.config';
import {ClanUtilsService} from './clan-utils.service';
import {ClanFirestoreService} from './clan-firestore.service';

@Injectable({
  providedIn: 'root'
})
export class ClanService {
  loading = signal<boolean>(false); // Состояние загрузки
  error = signal<string | null>(null); // Ошибки
  allClansIds: number[] = [];
  largeClansIds: number[] = [];
  topClanIds: number[] = [];
  topClanDetails = signal<ExtendedClanDetails [] | null>(null);
  totalPages = 0;
  totalClans = 0;
  clanDetails = signal<ExtendedClanDetails | null>(null);
  private http = inject(HttpClient);
  private limit = 100;
  private clanUtilsService = inject(ClanUtilsService);
  private firestoreService = inject(ClanFirestoreService);

  constructor() {
    void this.initData();
  }

  async getAllClansIds(): Promise<void> {
    this.allClansIds = [];

    try {
      this.loading.set(true);
      this.error.set(null);

      const firstResponse = await firstValueFrom(
        this.http.get<ClanListResponse>(
          `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${this.limit}&page_no=1`
        )
      );

      if (!firstResponse || !firstResponse.data) {
        throw new Error('❌ Ошибка первого запроса. Данные от API не получены');
      }

      this.totalClans = firstResponse.meta.total;
      this.totalPages = Math.ceil(this.totalClans / this.limit);
      console.log('✅ Всего кланов найдено: ', this.totalClans);

      this.allClansIds = await this.clanUtilsService.fetchPaginatedData<ClanListEntry, number>(
        (page) => `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${this.limit}&page_no=${page}`,
        this.totalPages,
        (response) => response.status === 'ok' && response.data
          ? Array.isArray(response.data)
            ? response.data.map(clan => clan.clan_id)
            : Object.values(response.data).map((clan: ClanListEntry) => clan.clan_id)
          : []
      );

      this.clanUtilsService.saveToStorage('allClansIds', this.allClansIds);
      await this.firestoreService.saveData('allClansIds', this.allClansIds);
      console.log('✅ Загрузка завершена!');
    } catch (err: any) {
      this.error.set(err.message);
      console.error('❌ Ошибка при загрузке кланов:', err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getBigClansIds(): Promise<void> {
    this.largeClansIds = [];
    if (!this.allClansIds.length) console.log('⚠ Массив allClansIds перед запуском getBigClansIds() пуст');

    if (!this.totalPages || this.totalPages <= 0) {
      this.totalPages = Math.ceil(this.allClansIds.length / this.limit);
    }

    console.log(`📌 Начинаем загрузку, всего страниц: ${this.totalPages}`);

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.clanUtilsService.fetchPaginatedData<ClanDetails, ClanDetails>(
        (page) => {
          {
            const chunkStart = (page - 1) * this.limit;
            const chunkIds = this.allClansIds.slice(chunkStart, chunkStart + this.limit);
            return `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${chunkIds.join(',')}`;
          }
        },
        this.totalPages,
        (response) => {
          if (response.status === 'ok' && response.data) {
            this.largeClansIds.push(
              ...Object.values(response.data)
                .filter(clan => clan && typeof clan.members_count === 'number' && clan.members_count >= 20)
                .map(clan => clan.clan_id)
            );
          }
          return [];
        }
      );

      this.clanUtilsService.saveToStorage('largeClansIds', this.largeClansIds);
      console.log('✅ `largeClansIds` сохранены в localStorage');

      await this.firestoreService.saveData('largeClansIds', this.largeClansIds);
      console.log('✅ `largeClansIds` сохранены в Firestore');

      console.log(`📌 Кланы с 20+ участниками: ${this.largeClansIds.length}`);
    } catch (err: any) {
      console.log(err);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClansIds(): Promise<void> {
    this.topClanIds = [];

    if (!this.largeClansIds || !Array.isArray(this.largeClansIds) || !this.largeClansIds.length) {
      console.warn('⚠ Нет сохранённых ID больших кланов!');
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
            clan.winRate = await this.clanUtilsService.getClanWinRate(clan.members_ids);
          })
        );
        if ((i / batchSize) % 5 === 0) { // Каждые 5 батчей (раз в 100 кланов при batchSize=20)
          console.clear();
          console.log(`✅ Обработано ${Math.min(i + batchSize, allClans.length)} из ${allClans.length}`);
        }
      }

      const filteredClans = allClans.filter(clan =>
        clan && typeof clan.clan_id === 'number' &&
        clan.clan_id > 0 && typeof clan.winRate === 'number' &&
        clan.winRate > 0 &&
        clan.winRate < 80);

      if (!filteredClans.length) {
        console.warn('⚠ После фильтрации по winRate > 0 нет кланов');
        this.topClanIds = [];
        return;
      }

      filteredClans.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));

      const top50 = filteredClans.slice(0, 50);
      this.topClanIds = top50.map(clan => clan.clan_id);

      this.clanUtilsService.saveToStorage('topClanIds', this.topClanIds);
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
      console.log('⚠ Список ID ТОП кланов пуст');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const cachedData = await this.clanUtilsService.loadDataWithFallback<ExtendedClanDetails[]>('topClanDetails', []);
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

        if (!res || !res.data) console.warn(`⚠ API не вернул данные о кланах в батче: ${batch}`);

        const clanList = Object.values(res.data) as ClanDetails[];
        const batchResults = await Promise.all(
          clanList.map(async (clan) => {
            const winRate = await this.clanUtilsService.getClanWinRate(clan.members_ids);
            return {...clan, winRate};
          })
        );
        extendedClans.push(...batchResults);
        extendedClans.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));

        this.topClanDetails.set([...extendedClans]);
      }

      this.clanUtilsService.saveToStorage('topClanDetails', extendedClans);
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
      const winRate = await this.clanUtilsService.getClanWinRate(clan.members_ids);
      this.clanDetails.set({...clan, winRate});
    } catch (error: any) {
      console.error(`❌ Ошибка при получении данных о клане ${clanId}:`, error);
      this.error.set('Ошибка загрузки данных о клане.');
    } finally {
      this.loading.set(false);
    }
  }

  async initData(): Promise<void> {
    this.allClansIds = await this.clanUtilsService.loadDataWithFallback('allClansIds', this.allClansIds);
    this.largeClansIds = await this.clanUtilsService.loadDataWithFallback('largeClansIds', this.largeClansIds);
    this.topClanIds = await this.clanUtilsService.loadDataWithFallback('topClanIds', this.topClanIds);
    this.firestoreService.loadCollection<ExtendedClanDetails[]>('topClanDetails')
      .then(firestoreData => {
        if (firestoreData && firestoreData.length > 0) {
          this.topClanDetails.set(firestoreData);
        } else console.warn('⚠ В Firestore нет `topClanDetails`');
      }).catch(error => {
      console.error('❌ Ошибка при загрузке `topClanDetails` из Firestore:', error.message);
      this.error.set(error.message);
    });
  }
}

import {inject, Injectable, signal} from '@angular/core';
import {BasicClanData, ExtendedClanDetails} from '../../models/clan/clan-response.model';
import {ClanUtilsService} from './clan-utils.service';
import {ClanFirestoreService} from './clan-firestore.service';
import {ClanIndexedDbService} from './clan-indexeddb.service';
import {ClanDataService} from './clan-data.service';
import {apiConfig} from '../../app.config';
import {lastValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {PlayerInfoResponse} from '../../models/player/player-response.model';


@Injectable({
  providedIn: 'root'
})
export class ClanService {
  loading = signal<boolean>(false); // Состояние загрузки
  error = signal<string | null>(null); // Ошибки
  allClansData: BasicClanData[] = [];
  largeClansIds: number[] = [];
  topClansIds: number[] = [];
  topClansDetails = signal<ExtendedClanDetails [] | null>(null);
  totalPages = 0;
  clanDetails = signal<ExtendedClanDetails | null>(null);
  clanPlayersList = signal<any[] | null>(null);
  private limit = 100;
  private clanUtilsService = inject(ClanUtilsService);
  private firestoreService = inject(ClanFirestoreService);
  private indexedDbService = inject(ClanIndexedDbService);
  private clanDataService = inject(ClanDataService);
  private http = inject(HttpClient);

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

      const largeClans = allClans
        .filter(clan => clan.members_count >= 20)
        .map(clan => clan.clan_id);

      console.log(`✅ Всего загружено кланов: ${allClans.length}`);
      console.log(`📌 Кланы с 20+ участниками: ${largeClans.length}`);

      this.allClansData = allClans;
      this.largeClansIds = largeClans;

      await Promise.all([
        this.clanDataService.saveDataToAllStorages('allClansData', this.allClansData),
        this.clanDataService.saveDataToAllStorages('largeClansIds', this.largeClansIds),
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
    this.topClansIds = [];

    if (!this.largeClansIds) {
      const ids = await this.clanDataService.getDataFromAllStorages('largeClansIds');
      this.largeClansIds = Array.isArray(ids) ? ids : [];
    }
    console.log(`Всего обрабатываем ${this.largeClansIds.length} кланов`);

    if (!this.totalPages) {
      this.totalPages = Math.ceil(this.largeClansIds.length / this.limit); // Округляем вверх
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const allClans = await this.clanDataService.fetchTopClans(this.limit, this.largeClansIds, this.totalPages);

      if (!allClans.length) {
        console.warn('⚠ Не удалось получить информацию ни по одному клану');
        return;
      }

      const batchSize = 20;
      for (let i = 0; i < allClans.length; i += batchSize) {
        const batch = allClans.slice(i, i + batchSize);
        await Promise.all(
          batch
            .filter(clan => clan?.members_ids?.length) // Проверяем, есть ли члены клана
            .map(async (clan) => {
              const stats = await this.clanUtilsService.getClansStats(clan.members_ids);
              clan.winRate = stats?.winRate ?? 0;
              clan.avgDamage = stats?.avgDamage ?? 0;
            })
        );
        console.log(`✅ Обработано ${Math.min(i + batchSize, allClans.length)} из ${allClans.length}`);
      }

      // Оставляем только кланы с валидным avgDamage и winRate
      const validClans = allClans.filter(clan =>
        clan &&
        typeof clan.clan_id === 'number' && clan.clan_id > 0 &&
        typeof clan.avgDamage === 'number' && clan.avgDamage > 0 &&
        typeof clan.winRate === 'number' && clan.winRate > 0
      );

      if (!validClans.length) {
        console.warn('⚠ Нет кланов с валидными avgDamage и winRate');
        this.topClansIds = [];
        return;
      }

      const top100ByDamage = validClans
        .sort((a, b) => (b.avgDamage ?? 0) - (a.avgDamage ?? 0))
        .slice(0, 100);

      if (!top100ByDamage.length) {
        console.warn('⚠ После фильтрации по avgDamage > 0 нет кланов');
        this.topClansIds = [];
        return;
      }

      const top50ByWinRate = top100ByDamage
        .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
        .slice(0, 50);

      this.topClansIds = top50ByWinRate.map(clan => clan.clan_id);
      console.log('📌 Топ-50 кланов:', this.topClansIds);
      await this.clanDataService.saveDataToAllStorages('topClansIds', this.topClansIds);
    } catch (err: any) {
      console.error('❌ Ошибка в getTopClansIds:', err.message);
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClansDetails(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      this.topClansDetails.set(null);

      const storedData = await this.clanDataService.getDataFromAllStorages<ExtendedClanDetails[]>('topClansDetails');
      if (storedData && storedData.length > 0) {
        const firestoreData = await this.firestoreService.loadData('topClansDetails');
        if (firestoreData && this.clanDataService.isDataFresh(firestoreData.timestamp)) {
          const timestamp = firestoreData.timestamp; // Предполагаем, что это UNIX timestamp (в миллисекундах)
          const timeDiffMs = Date.now() - timestamp;
          const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
          console.log(`✅ Данные свежие (${hours}ч ${minutes}м назад)`);
          this.topClansDetails.set(storedData);
          return;
        }
      }

      const topClans = await this.clanDataService.fetchTopClansDetails(this.topClansIds)
        .then(data => Array.isArray(data) ? data : []);
      if (!topClans.length) {
        console.warn('⚠ Не удалось получить детали топ-кланов');
        return;
      }

      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < topClans.length; i += batchSize) {
        const batch = topClans.slice(i, i + batchSize);
        batches.push(
          Promise.allSettled(
            batch.map(async (clan) => {
              const stats = await this.clanUtilsService.getClansStats(clan.members_ids);
              clan.winRate = stats.winRate;
              clan.avgDamage = stats.avgDamage;
            })
          )
        );
        await new Promise(resolve => setTimeout(resolve, 100)); // Короткая задержка для API
      }
      await Promise.all(batches);
      topClans.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
      this.topClansDetails.set(topClans);

      await this.clanDataService.saveDataToAllStorages('topClansDetails', topClans);
      console.log('✅ topClansDetails сохранены во все БД');
    } catch (err: any) {
      console.error('❌ Ошибка в getTopClansDetails:', err.message);
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getClanDetailsById(clanId: number): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const clans = await this.clanDataService.fetchTopClansDetails([clanId]);
      if (!clans.length) {
        console.warn(`⚠ API не вернул данные о клане с ID: ${clanId}`);
        this.error.set('Данные о клане не найдены.');
        return;
      }

      const clan = clans[0];
      const stats = await this.clanUtilsService.getClansStats(clan.members_ids);
      await this.getClanPlayersListAndStats(clan.members_ids);
      this.clanDetails.set({...clan, winRate: stats.winRate, avgDamage: stats.avgDamage,});
    } catch (error: any) {
      console.error(`❌ Ошибка при получении данных о клане ${clanId}:`, error);
      this.error.set('Ошибка загрузки данных о клане.');
    } finally {
      this.loading.set(false);
    }
  }

  async getClanPlayersListAndStats(memberIds: number[]): Promise<void> {
    if (!memberIds.length) {
      console.error(`❌ Ошибка получения айди игроков клана`);
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${memberIds.join(',')}`;
      const res = await lastValueFrom(this.http.get<PlayerInfoResponse>(url));
      if (res.status === 'ok' && res.data) {
        const playersList = memberIds
          .map((memberId) => res.data[memberId]);
        this.clanPlayersList.set(playersList);
      }
    } catch (error: any) {
      console.log(error.message);
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

  async initData(): Promise<void> {
    try {
      const [allClansData, largeClansIds, topClansIds, topClansDetails] = await Promise.all([
        this.clanDataService.getDataFromAllStorages<BasicClanData[]>('allClansData')
          .then(data => Array.isArray(data) ? data : []),
        this.clanDataService.getDataFromAllStorages<number[]>('largeClansIds')
          .then(data => Array.isArray(data) ? data : []),
        this.clanDataService.getDataFromAllStorages<number[]>('topClansIds')
          .then(data => Array.isArray(data) ? data : []),
        this.clanDataService.getDataFromAllStorages<ExtendedClanDetails[]>('topClansDetails')
          .then(data => Array.isArray(data) ? data : []),
      ]);

      this.allClansData = allClansData;
      this.largeClansIds = largeClansIds;
      this.topClansIds = topClansIds;
      this.topClansDetails.set(topClansDetails); // Устанавливаем данные в сигнал

      if (topClansDetails.length > 0) {
        console.log('✅ Данные topClansDetails загружены из хранилища');
      } else {
        console.warn('⚠ В хранилищах нет `topClansDetails`');
      }
    } catch (error: any) {
      console.error('❌ Ошибка при инициализации данных:', error.message);
    }
  }
}

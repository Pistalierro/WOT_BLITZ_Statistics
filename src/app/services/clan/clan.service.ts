import {inject, Injectable, signal} from '@angular/core';
import {BasicClanData, ExtendedClanDetails} from '../../models/clan/clan-response.model';
import {ClanUtilsService} from './clan-utils.service';
import {ClanDataService} from './clan-data.service';
import {apiConfig} from '../../app.config';
import {lastValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {PlayerData, PlayerInfoResponse} from '../../models/player/player-response.model';
import {SyncService} from '../../shared/services/data/sync.service';
import {IndexedDbService} from '../../shared/services/data/indexed-db.service';


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
  clanPlayersList = signal<PlayerData[] | null>(null);
  private limit = 100;
  private clanUtilsService = inject(ClanUtilsService);
  private indexedDbService = inject(IndexedDbService);
  private clanDataService = inject(ClanDataService);
  private syncService = inject(SyncService);
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
        this.syncService.saveDataToAllStorages('clans', 'allClansData', this.allClansData),
        this.syncService.saveDataToAllStorages('clans', 'largeClansIds', this.largeClansIds)
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
      const largeClansIdsRow = await this.syncService.getDataFromAllStorages<number[]>('clans', 'largeClansIds');
      this.largeClansIds = (largeClansIdsRow) ? largeClansIdsRow : [];
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

      const batchSize = 100;
      for (let i = 0; i < allClans.length; i += batchSize) {
        const batch = allClans.slice(i, i + batchSize);
        await Promise.all(
          batch
            .filter(clan => clan?.members_ids?.length) // Проверяем, есть ли члены клана
            .map(async (clan) => {
              const stats = await this.clanUtilsService.getClansStats(clan.members_ids, true);
              clan.winRate = stats?.winRate ?? 0;
              clan.avgDamage = stats?.avgDamage ?? 0;
              clan.zeroBattlesCount = stats?.zeroBattlesCount ?? 0;
            })
        );
        console.log(`✅ Обработано ${Math.min(i + batchSize, allClans.length)} из ${allClans.length}`);
      }

      const validClans = allClans.filter(clan =>
        clan &&
        typeof clan.clan_id === 'number' && clan.clan_id > 0 &&
        (clan.zeroBattlesCount ?? 0) <= 5 &&
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
        .slice(0, 200);

      if (!top100ByDamage.length) {
        console.warn('⚠ После фильтрации по avgDamage > 0 нет кланов');
        this.topClansIds = [];
        return;
      }

      const top100ByWinRate = top100ByDamage
        .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
        .slice(0, 100);

      this.topClansIds = top100ByWinRate.map(clan => clan.clan_id);
      console.log('📌 Топ-50 кланов:', this.topClansIds);
      await this.syncService.saveDataToAllStorages('clans', 'topClansIds', this.topClansIds);
    } catch (err: any) {
      console.error('❌ Ошибка в getTopClansIds:', err.message);
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClansDetails(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (!this.topClansIds.length) {
        const topClansIdsArr = await this.syncService.getDataFromAllStorages<number[]>('clans', 'topClansIds');
        this.topClansIds = Array.isArray(topClansIdsArr) ? topClansIdsArr : [];
      }

      const topClans = await this.syncService.getDataFromAllStorages<ExtendedClanDetails[]>(
        'clans',
        'topClansDetails',
        async () => {
          const arrFromApi = await this.clanDataService.fetchTopClansDetails(this.topClansIds)
            .then(data => Array.isArray(data) ? data : []);
          if (!arrFromApi.length) {
            console.warn('⚠ Не удалось получить детали топ-кланов (API вернул пусто).');
            return [];
          }

          const batchSize = 20;
          const batches = [];
          for (let i = 0; i < arrFromApi.length; i += batchSize) {
            const batch = arrFromApi.slice(i, i + batchSize);
            batches.push(
              Promise.allSettled(
                batch.map(async (clan) => {
                  const stats = await this.clanUtilsService.getClansStats(clan.members_ids);
                  clan.winRate = stats.winRate;
                  clan.avgDamage = stats.avgDamage;
                })
              )
            );
            await new Promise(resolve => setTimeout(resolve, 100)); // Небольшая задержка для API
          }
          await Promise.all(batches);

          arrFromApi.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
          return arrFromApi;
        },
        true,
        6
      );

      if (!topClans || !topClans.length) {
        console.warn('⚠ Данные по топ-кланам не найдены или API вернул пусто.');
      } else {
        this.topClansDetails.set(topClans);
        console.log('✅ topClansDetails получены и обновлены.');
      }

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
      const [allClansDataRaw, largeClansIdsRaw, topClansIds, topClansDetails] = await Promise.all([
        this.syncService.getDataFromAllStorages<BasicClanData[]>('clans', 'allClansData'),
        this.syncService.getDataFromAllStorages<number[]>('clans', 'largeClansIds'),
        this.syncService.getDataFromAllStorages<number[]>('clans', 'topClansIds'),
        this.syncService.getDataFromAllStorages<ExtendedClanDetails[]>('clans', 'topClansDetails')
          .then(data => Array.isArray(data) ? data : []),
      ]);

      this.allClansData = Array.isArray(allClansDataRaw) ? allClansDataRaw : [];
      this.largeClansIds = Array.isArray(largeClansIdsRaw) ? largeClansIdsRaw : [];
      this.topClansIds = Array.isArray(topClansIds) ? topClansIds : [];
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

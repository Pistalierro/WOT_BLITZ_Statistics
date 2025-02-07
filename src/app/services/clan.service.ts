import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ClanDetails, ClanDetailsResponse, ClanListResponse} from '../models/clan/clan-response.model';
import {catchError, firstValueFrom, lastValueFrom, of} from 'rxjs';
import {apiConfig} from '../app.config';
import {top50ClanIds} from '../mock/clan-utils';

@Injectable({
  providedIn: 'root'
})
export class ClanService {
  loading = signal<boolean>(false); // Состояние загрузки
  error = signal<string | null>(null); // Ошибки
  allClanIds: number[] = [];
  topClanIds: number[] = [];
  topClanDetails = signal<ClanDetails [] | null>(null);
  private http = inject(HttpClient);
  private limit = 100;
  private batchSize = 10;

  constructor() {
    this.loadClanIdsFromStorage();
    this.loadTopClanIdsFromStorage();
  }

  async getAllClanIds(): Promise<void> {
    this.allClanIds = [];

    try {
      this.loading.set(true);
      this.error.set(null);
      const firstResponse = await lastValueFrom(
        this.http.get<ClanListResponse>(
          `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${this.limit}&page_no=1`
        )
      );

      if (!firstResponse || !firstResponse.data) {
        throw new Error('Пустой ответ от API');
      }

      const totalClans = firstResponse.meta.total;
      const totalPages = Math.ceil(totalClans / this.limit);
      console.log(`Всего кланов: ${totalClans}, всего страниц: ${totalPages}`);

      let allClans = [...firstResponse.data];

      for (let i = 2; i <= totalPages; i += this.batchSize) {
        const batchRequests = [];

        for (let j = 0; j < this.batchSize && i + j <= totalPages; j++) {
          batchRequests.push(
            lastValueFrom(
              this.http.get<ClanListResponse>(
                `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${this.limit}&page_no=${i + j}`
              )
            )
          );
        }

        const batchResponses = await Promise.all(batchRequests);
        allClans = allClans.concat(...batchResponses.map(res => res.data || []));

        console.log(`Загружено страниц: ${i}-${Math.min(i + this.batchSize - 1, totalPages)}`);
      }

      this.allClanIds = allClans.map(clan => clan.clan_id).filter(id => typeof id === 'number');

      this.saveClanIdsToStorage();
      console.log('✅ Все ID кланов сохранены:', this.allClanIds);
    } catch (error: any) {
      console.error('❌ Ошибка при загрузке кланов:', error.message);
      this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClanIds(): Promise<void> {
    if (!this.allClanIds.length) {
      console.warn('⚠ Нет сохранённых ID кланов!');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const batchSize = 100;
      const parallelRequests = 10;
      let allClanDetails: ClanDetails[] = [];
      let totalBatches = Math.ceil(this.allClanIds.length / batchSize);

      for (let i = 0; i < totalBatches; i += parallelRequests) {
        const chunkPromises = [];

        for (let j = 0; j < parallelRequests && i + j < totalBatches; j++) {
          const batchIds = this.allClanIds.slice((i + j) * batchSize, (i + j + 1) * batchSize).join(',');
          if (!batchIds) continue;

          const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${batchIds}`;
          console.log(`🔄 Запрос данных: ${url}`);

          chunkPromises.push(
            lastValueFrom(
              this.http.get<ClanDetailsResponse>(url).pipe(
                catchError(err => {
                  console.error(`❌ Ошибка запроса: ${url}`, err);
                  return of(null);
                })
              )
            )
          );
        }

        const responses = await Promise.all(chunkPromises);

        responses.forEach(response => {
          if (response && response.status === 'ok' && response.data) {
            const clanDataArray: ClanDetails[] = Object.values(response.data);
            allClanDetails = allClanDetails.concat(clanDataArray);
            console.log(`✅ Загружено кланов в чанке: ${clanDataArray.length}, всего загружено: ${allClanDetails.length}/${this.allClanIds.length}`);
          }
        });

        await this.delay(2000);
      }

      console.log('✅ Все данные получены:', allClanDetails);

      const topClans = allClanDetails
        .filter(clan => clan.recruiting_options?.wins_ratio !== undefined)
        .sort((a, b) => b.recruiting_options.wins_ratio - a.recruiting_options.wins_ratio)
        .slice(0, 50);

      this.topClanIds = topClans.map(clan => clan.clan_id);
      console.log('🔥 Топ-50 кланов по проценту побед:', this.topClanIds);

      localStorage.setItem('topClanIds', JSON.stringify(this.topClanIds));
    } catch (error: any) {
      console.error('❌ Ошибка при получении данных о кланах:', error);
      this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async getTopClanDetails(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (!this.topClanIds.length) {
        throw new Error('⚠ Нет данных о топ-кланах. Сначала вызовите getTopClanIds().');
      }

      const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${top50ClanIds.join(',')}`;
      const res = await firstValueFrom(
        this.http.get<ClanDetailsResponse>(url)
      );

      if (res && res.status === 'ok' && res.data) {
        const clanDetailsArray: ClanDetails[] = Object.values(res.data);
        console.log('✅ Данные о топ-кланах загружены:', clanDetailsArray);

        this.topClanDetails.set(clanDetailsArray);
      } else {
        throw new Error('⚠ Некорректный ответ от API.');
      }
    } catch (error: any) {
      console.error('❌ Ошибка при загрузке данных о топ-кланах:', error);
      this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }


  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadClanIdsFromStorage(): void {
    const storeClanIds = localStorage.getItem('allClanIds');
    if (storeClanIds) {
      this.allClanIds = JSON.parse(storeClanIds);
      // console.log('🔄 Загружены ID кланов из localStorage:', this.allClanIds);
    }
  }

  private loadTopClanIdsFromStorage(): void {
    const storedTopIds = localStorage.getItem('topClanIds');
    if (storedTopIds) {
      this.topClanIds = JSON.parse(storedTopIds);
      // console.log('🔄 Загружены топ-50 кланов из localStorage:', this.topClanIds);
    }
  }

  private saveClanIdsToStorage(): void {
    localStorage.setItem('allClanIds', JSON.stringify(this.allClanIds));
  }
}

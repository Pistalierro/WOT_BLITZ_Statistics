import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ClanUtilsService} from './clan-utils.service';
import {ApiResponse, BasicClanData, ClanDetails, ClanListResponse, ExtendedClanDetails} from '../../models/clan/clan-response.model';
import {apiConfig} from '../../app.config';
import {firstValueFrom, lastValueFrom} from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class ClanDataService {

  private http = inject(HttpClient);
  private utilsService = inject(ClanUtilsService);

  async fetchAllClans(limit: number, maxRetries: number = 3, delayMs: number = 1000): Promise<BasicClanData[]> {
    console.log(`📌 Начинаем загрузку всех кланов (лимит: ${limit})`);

    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        console.log(`🔄 Попытка ${attempt + 1} / ${maxRetries}`);

        const firstResponse = await firstValueFrom(
          this.http.get<ClanListResponse>(
            `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${limit}&page_no=1`
          )
        );

        if (!firstResponse || !firstResponse.data) {
          throw new Error('❌ Ошибка первого запроса. Данные от API не получены');
        }

        const totalClans = firstResponse.meta.total;
        const totalPages = Math.ceil(totalClans / limit);

        console.log(`✅ Всего кланов: ${totalClans}, всего страниц: ${totalPages}`);

        if (totalPages === 0) {
          throw new Error('⚠️ В API нет данных о кланах (0 страниц).');
        }

        const allData = await this.utilsService.fetchPaginatedData<ClanDetails, BasicClanData>(
          (page) =>
            `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${limit}&page_no=${page}`,
          totalPages,
          (response: ApiResponse<ClanDetails>) => {
            if (!response || response.status !== 'ok' || !response.data) {
              console.warn('⚠️ Пустые данные или статус ошибки в API ответе:', response);
              return [];
            }

            const rawDataArray: ClanDetails[] = Array.isArray(response.data)
              ? response.data
              : Object.values(response.data ?? {});

            return rawDataArray.map((clan) => ({
              clan_id: clan.clan_id,
              name: clan.name,
              tag: clan.tag,
              members_count: clan.members_count ?? 0,
              created_at: clan.created_at ?? 0,
            }));
          }
        );

        if (!allData.length) {
          throw new Error('❌ Загруженные данные о кланах пусты!');
        }

        console.log(`✅ Загружено ${allData.length} кланов.`);
        return allData;

      } catch (error: any) {
        console.error(`⚠️ Ошибка при загрузке (Попытка ${attempt + 1} / ${maxRetries}):`, error.message);

        if (attempt < maxRetries - 1) {
          const waitTime = delayMs * Math.pow(2, attempt);
          console.log(`⏳ Ожидание ${waitTime / 1000} секунд перед повторной попыткой...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          console.error('❌ Исчерпаны все попытки запроса. API недоступен.');
          return [];
        }
      }
      attempt++;
    }
    return [];
  }

  async fetchTopClans(limit: number, clansIds: number[], totalPages: number): Promise<ExtendedClanDetails[]> {
    console.log(`📌 Начинаем загрузку данных о топ-кланах`);
    if (!clansIds || !clansIds.length) {
      throw new Error('❌ Нет ID больших кланов для загрузки!');
    }
    console.log(`✅ Всего страниц: ${totalPages}`);

    try {
      const allClans = await this.utilsService.fetchPaginatedData<ClanDetails, ExtendedClanDetails>(
        (page) => {
          const chunkStart = (page - 1) * limit;
          const chunkIds = clansIds.slice(chunkStart, chunkStart + limit);
          return `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${chunkIds.join(',')}`;
        },
        totalPages,
        (response: ApiResponse<ClanDetails>) => {
          const result: ExtendedClanDetails[] = [];

          if (response.status === 'ok' && response.data) {
            for (const clanId in response.data) {
              const clanData = response.data[clanId];
              if (!clanData) {
                console.warn(`⚠ Нет данных по клану с ID ${clanId} — пропускаем`);
                continue;
              }
              result.push({...clanData, winRate: 0} as ExtendedClanDetails);
            }
          }
          return result;
        }
      );

      if (!allClans.length) {
        throw new Error('❌ Данные по кланам не получены!');
      }

      console.log(`✅ Получено данных по ${allClans.length} кланам`);
      return allClans;
    } catch (error: any) {
      console.error('❌ Ошибка при загрузке топ-кланов:', error.message);
      return [];
    }
  }

  async fetchTopClansDetails(clansIds: number[]): Promise<ExtendedClanDetails[]> {
    if (!clansIds || clansIds.length === 0) {
      throw new Error('❌ Нет ID кланов для загрузки!');
    }

    try {
      const validClanIds = clansIds.filter(id => typeof id === 'number');
      const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${validClanIds.join(',')}`;
      const response = await lastValueFrom(
        this.http.get<ApiResponse<Record<number, ClanDetails>>>(url)
      );

      if (response.status !== 'ok' || !response.data) {
        console.warn('⚠ API не вернул данные по кланам');
        return [];
      }

      const clanDetails: ExtendedClanDetails[] = Object.values(response.data).map(clan => ({
        ...clan, winRate: null, avgDamage: null, zeroBattlesCount: null
      } as ExtendedClanDetails));

      console.log(`✅ Получено ${clanDetails.length} кланов`);
      return clanDetails;
    } catch (error: any) {
      console.error('❌ Ошибка при загрузке списка топ-кланов:', error.message);
      return [];
    }
  }


}

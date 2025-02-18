import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ClanIndexedDbService} from './clan-indexeddb.service';
import {ClanFirestoreService} from './clan-firestore.service';
import {ClanUtilsService} from './clan-utils.service';
import {ApiResponse, BasicClanData, ClanDetails, ClanListResponse} from '../../models/clan/clan-response.model';
import {apiConfig} from '../../app.config';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClanDataService {

  private http = inject(HttpClient);
  private indexedDbService = inject(ClanIndexedDbService);
  private firestoreService = inject(ClanFirestoreService);
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
}

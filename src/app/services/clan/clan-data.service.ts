import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ClanIndexedDbService} from './clan-indexeddb.service';
import {ClanFirestoreService} from './clan-firestore.service';
import {ClanUtilsService} from './clan-utils.service';
import {BasicClanData, ClanListResponse} from '../../models/clan/clan-response.model';
import {apiConfig} from '../../app.config';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClanDataService {
  private http = inject(HttpClient);
  private indexedDbService = inject(ClanIndexedDbService);
  private firestoreService = inject(ClanFirestoreService);
  private utilsService = inject(ClanUtilsService);

  async fetchAllClans(limit: number): Promise<BasicClanData[]> {
    console.log(`📌 Начинаем загрузку всех кланов (лимит: ${limit})`);

    const firstResponse = await firstValueFrom(
      this.http.get<ClanListResponse>(
        `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${limit}&page_no=1`
      )
    );

    if (!firstResponse?.data) {
      throw new Error('❌ Ошибка первого запроса. Данные от API не получены');
    }

    const totalPages = Math.ceil(firstResponse.meta.total / limit);
    console.log(`✅ Всего страниц: ${totalPages}`);

    // 🔥 Загружаем все страницы с помощью `fetchPaginatedData`
    const allClans = await this.utilsService.fetchPaginatedData(
      (page) => `${apiConfig.baseUrl}/clans/list/?application_id=${apiConfig.applicationId}&limit=${limit}&page_no=${page}`,
      totalPages,
      (response) => response.data.map(clan => ({
        clan_id: clan.clan_id,
        name: clan.name,
        tag: clan.tag,
        members_count: clan.members_count,
        created_at: clan.created_at
      }))
    );

    console.log(`✅ Загружено ${allClans.length} кланов. Сохраняем в IndexedDB и Firestore...`);

    // 🔥 Сохранение в IndexedDB и Firestore
    await this.indexedDbService.clearAllClans();
    await this.indexedDbService.addClans(allClans);
    await this.firestoreService.saveData('allClansData', allClans);

    console.log('✅ Данные о кланах сохранены!');
    return allClans;
  }
}

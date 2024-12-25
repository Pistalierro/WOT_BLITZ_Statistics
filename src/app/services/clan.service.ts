import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {ClanAccountInfoResponseInterface, ClanInfoResponseInterface} from '../models/clan-response.model';

@Injectable({
  providedIn: 'root'
})
export class ClanService {

  clanInfo = signal<{ name: string, tag: string } | null>(null);
  error = signal<string | null>(null);
  private http = inject(HttpClient);

  getClanInfo(clanId: number): void {
    const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
    this.http.get<ClanInfoResponseInterface>(url).subscribe({
      next: (res: ClanInfoResponseInterface) => {
        const clanData = res.data[clanId];
        if (clanData) {
          this.clanInfo.set({name: clanData.name, tag: clanData.tag});
        } else {
          console.warn('Данные о клане отсутствуют.');
          this.clanInfo.set(null);
        }
      },
      error: (err) => {
        console.error('Ошибка получения информации о клане:', err);
        this.error.set(`Ошибка получения информации о клане: ${err.message}`);
      },
    });
  }

  getClanId(accountId: number): void {
    const url = `${apiConfig.baseUrl}/clans/accountinfo/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
    this.http.get<ClanAccountInfoResponseInterface>(url).subscribe({
      next: (res: ClanAccountInfoResponseInterface) => {
        const clanId = res.data[accountId]?.clan_id;
        if (clanId) {
          console.log('ID клана:', clanId);
          this.getClanInfo(clanId);
        } else {
          console.warn('Игрок не состоит в клане.');
          this.clanInfo.set(null);
        }
      },
      error: (err) => {
        console.error('Ошибка получения clan_id:', err);
        this.error.set(`Ошибка получения clan_id: ${err.message}`);
      },
    });
  }

}

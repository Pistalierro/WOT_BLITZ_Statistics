import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {ClanAccountInfoResponseInterface, ClanInfoResponseInterface} from '../models/clan/clan-response.model';

@Injectable({
  providedIn: 'root'
})
export class ClanService {

  clanInfo = signal<{ name: string, tag: string } | null>(null);
  loading = signal<boolean | null>(null);
  error = signal<string | null>(null);
  private http = inject(HttpClient);

  getClanInfo(clanId: number): void {
    this.loading.set(true);
    const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
    this.http.get<ClanInfoResponseInterface>(url).subscribe({
      next: (res: ClanInfoResponseInterface) => {
        this.loading.set(false);
        const clanData = res.data[clanId];
        if (clanData) this.clanInfo.set({name: clanData.name, tag: clanData.tag});
        else {
          this.loading.set(false);
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
    this.loading.set(true);
    const url = `${apiConfig.baseUrl}/clans/accountinfo/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
    this.http.get<ClanAccountInfoResponseInterface>(url).subscribe({
      next: (res: ClanAccountInfoResponseInterface) => {
        this.loading.set(false);
        const clanId = res.data[accountId]?.clan_id;
        if (clanId) this.getClanInfo(clanId);
        else {
          console.warn('Игрок не состоит в клане.');
          this.clanInfo.set(null);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Ошибка получения clan_id:', err);
        this.error.set(`Ошибка получения clan_id: ${err.message}`);
      },
    });
  }

}

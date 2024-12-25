import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {ClanResponseInterface} from '../models/clan-responce.model';
import {PlayerResponseInterface} from '../models/player-response.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playerInfo = signal<PlayerResponseInterface | null>(null); // Данные игрока
  clanInfo = signal<ClanResponseInterface | null>(null); // Данные о клане
  error = signal<any>(null);
  // Вычисляемая дата создания аккаунта
  accountCreationDate = computed(() => {
    const player = this.playerInfo();
    if (!player?.created_at) return null;
    return new Date(player.created_at * 1000).toLocaleDateString(); // Конвертация UNIX в дату
  });

  winRate = computed(() => {
    const player = this.playerInfo();
    if (!player?.statistics?.all?.battles) return 0;
    return (player.statistics.all.wins / player.statistics.all.battles) * 100;
  });
  private http = inject(HttpClient);

  getPlayerInfo(accountId: string): void {
    const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
    this.http.get<any>(url).subscribe({
      next: (res: any) => {
        console.log(res);
        const playerData = res.data[accountId];
        this.playerInfo.set(playerData || null);
      },
      error: (err: any) => {
        this.error.set('Ошибка получения данных игрока: ' + err);
        this.playerInfo.set(null);
      }
    });
  }

  getClanInfo(clanId: number): void {
    const url = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
    this.http.get<any>(url).subscribe({
      next: (res: any) => {
        const clanData = res.data[clanId];
        this.clanInfo.set(clanData);
        console.log('Данные клана:', clanData);
      },
      error: (err: any) => {
        this.error.set('Ошибка получения данных клана: ' + err.message);
        console.error('Ошибка:', err);
      }
    });
  }
}

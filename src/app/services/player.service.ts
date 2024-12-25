import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {AccountListResponse, PlayerApiResponse, PlayerInfoInterface} from '../models/player-response.model';


@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playerId = signal<number | null>(null);
  playerInfo = signal<PlayerInfoInterface | null>(null); // Данные игрока
  error = signal<any>(null);

  private http = inject(HttpClient);

  searchPlayer(nickName: string): void {
    const url = `${apiConfig.baseUrl}/account/list/?application_id=${apiConfig.applicationId}&search=${nickName}`;
    this.http.get<AccountListResponse>(url).subscribe({
      next: (res) => {
        const accountId = Object.values(res.data)[0]?.account_id;
        if (accountId) {
          this.playerId.set(Number(accountId)); // Преобразуем ID в число
        } else {
          console.error('Игрок с таким никнеймом не найден.');
          this.playerId.set(null); // Очищаем ID
        }
      },
      error: (err) => {
        console.error('Ошибка поиска игрока:', err);
        this.error.set('Ошибка поиска игрока.');
      },
    });
  }

  getPlayerInfo(accountId: number): void {
    const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
    this.http.get<PlayerApiResponse>(url).subscribe({
      next: (res) => {
        this.playerInfo.set(res.data[accountId]); // Сохраняем данные игрока
      },
      error: (err) => {
        console.error('Ошибка получения информации об игроке:', err);
        this.error.set('Ошибка получения информации об игроке.');
      },
    });
  }
}

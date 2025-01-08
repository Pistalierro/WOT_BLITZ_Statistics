import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, firstValueFrom, throwError} from 'rxjs';
import {apiConfig} from '../app.config';
import {
  ClanAccountInfoResponse,
  ClanInfoResponse,
  PlayerData,
  PlayerInfoResponse,
  PlayerSearchResponse
} from '../models/player-response.model';

@Injectable({providedIn: 'root'})
export class PlayerService {
  playerData = signal<PlayerData | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private http = inject(HttpClient);

  async fetchPlayerData(nickname: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.playerData.set(null);

    try {
      // 1. Получаем playerId
      const searchUrl = `${apiConfig.baseUrl}/account/list/?application_id=${apiConfig.applicationId}&search=${nickname}`;
      const searchRes: PlayerSearchResponse = await firstValueFrom(
        this.http.get<PlayerSearchResponse>(searchUrl).pipe(
          catchError(err => throwError(() => new Error('Ошибка поиска игрока: ' + err.message)))
        )
      );

      if (!searchRes.data.length) {
        this.error.set('Игрок с таким никнеймом не найден');
        return;
      }

      const playerId = searchRes.data[0].account_id;

      // 2. Получаем информацию об игроке
      const infoUrl = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${playerId}&fields=created_at,nickname,statistics.all`;
      const infoRes: PlayerInfoResponse = await firstValueFrom(
        this.http.get<PlayerInfoResponse>(infoUrl).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения информации об игроке: ' + err.message)))
        )
      );

      const playerInfo = infoRes.data?.[playerId];
      if (!playerInfo) {
        this.error.set('Информация об игроке не найдена');
        return;
      }

      // 3. Получаем информацию о клане
      const clanUrl = `${apiConfig.baseUrl}/clans/accountinfo/?application_id=${apiConfig.applicationId}&account_id=${playerId}`;
      const clanRes: ClanAccountInfoResponse = await firstValueFrom(
        this.http.get<ClanAccountInfoResponse>(clanUrl).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения информации о клане: ' + err.message)))
        )
      );

      const clanId = clanRes.data[playerId]?.clan_id;
      let clanInfo = null;
      if (clanId) {
        const clanInfoUrl = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
        const clanInfoRes: ClanInfoResponse = await firstValueFrom(
          this.http.get<ClanInfoResponse>(clanInfoUrl).pipe(
            catchError(err => throwError(() => new Error('Ошибка получения информации о клане: ' + err.message)))
          )
        );

        const clanData = clanInfoRes.data[clanId];
        if (clanData) {
          clanInfo = {
            name: clanData.name,
            tag: clanData.tag,
          };
        }
      }

      // 4. Формируем итоговую структуру PlayerData
      const finalData: PlayerData = {
        playerId,
        created_at: playerInfo.created_at,
        nickname: playerInfo.nickname,
        statistics: playerInfo.statistics,
        clan: clanInfo || undefined,
      };

      this.playerData.set(finalData);

    } catch (error: any) {
      this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }
}

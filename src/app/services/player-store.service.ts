import {inject, Injectable, signal} from '@angular/core';
import {
  ClanAccountInfoResponse,
  ClanInfoResponse,
  PlayerData,
  PlayerInfoResponse,
  PlayerSearchResponse
} from '../models/player-response.model';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, firstValueFrom, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerStoreService {

  nickname = signal<string | null>(null);
  accountId = signal<number | null>(null);
  playerData = signal<PlayerData | null>(null);

  loading = signal<boolean | null>(null);
  error = signal<string | null>(null);

  private http = inject(HttpClient);

  async loadPlayerData(nickname: string): Promise<void> {
    if (!nickname) {
      this.error.set('Никнейм отсутствует');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.accountId.set(null);
    this.playerData.set(null);

    // 1. Получаем playerId
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
      this.accountId.set(playerId);

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

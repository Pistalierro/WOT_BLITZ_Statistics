import {inject, Injectable, signal} from '@angular/core';

import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, firstValueFrom} from 'rxjs';
import {
  ClanAccountInfoResponse,
  ClanInfoResponse,
  PlayerData,
  PlayerInfoResponse,
  PlayerSearchResponse
} from '../models/player/player-response.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerStoreService {
  nickname = signal<string | null>(null);
  accountId = signal<number | null>(null);
  playerData = signal<PlayerData | null>(null);
  searchedPlayerData = signal<PlayerData | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private http = inject(HttpClient);

  async fetchAndSetPlayerData(nickname: string, targetSignal: typeof this.playerData): Promise<void> {
    if (!nickname) {
      console.warn('Nickname is empty.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    targetSignal.set(null);

    try {
      const playerData = await this.fetchPlayerData(nickname);
      targetSignal.set(playerData);
    } catch (error: any) {
      this.error.set(error.message || 'Произошла ошибка');
    } finally {
      this.loading.set(false);
    }
  }

  loadPlayerData(nickname: string): Promise<void> {
    return this.fetchAndSetPlayerData(nickname, this.playerData);
  }

  loadSearchedPlayerData(nickname: string): Promise<void> {
    return this.fetchAndSetPlayerData(nickname, this.searchedPlayerData);
  }

  private async fetchPlayerData(nickname: string): Promise<PlayerData> {
    const searchUrl = `${apiConfig.baseUrl}/account/list/?application_id=${apiConfig.applicationId}&search=${nickname}`;
    const searchRes = await firstValueFrom(
      this.http.get<PlayerSearchResponse>(searchUrl).pipe(
        catchError(err => {
          throw new Error('Ошибка поиска игрока: ' + err.message);
        })
      )
    );

    if (!searchRes.data.length) {
      throw new Error('Игрок с таким никнеймом не найден');
    }

    const playerId = searchRes.data[0].account_id;
    this.accountId.set(playerId);

    const playerInfoUrl = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${playerId}`;
    const infoRes = await firstValueFrom(
      this.http.get<PlayerInfoResponse>(playerInfoUrl).pipe(
        catchError(err => {
          throw new Error('Ошибка получения информации об игроке: ' + err.message);
        })
      )
    );

    const playerFullInfo = infoRes.data?.[playerId];
    if (!playerFullInfo) {
      throw new Error('Информация об игроке не найдена');
    }

    let clanData = null;
    const clanUrl = `${apiConfig.baseUrl}/clans/accountinfo/?application_id=${apiConfig.applicationId}&account_id=${playerId}`;
    const clanRes = await firstValueFrom(
      this.http.get<ClanAccountInfoResponse>(clanUrl).pipe(
        catchError(err => {
          throw new Error('Ошибка получения информации о клане: ' + err.message);
        })
      )
    );

    const clanId = clanRes.data[playerId]?.clan_id;
    if (clanId) {
      const clanFullInfoUrl = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
      const clanFullInfoRes = await firstValueFrom(
        this.http.get<ClanInfoResponse>(clanFullInfoUrl).pipe(
          catchError(err => {
            throw new Error('Ошибка получения информации о клане: ' + err.message);
          })
        )
      );
      clanData = clanFullInfoRes.data[clanId];
    }

    return {
      playerId,
      created_at: playerFullInfo.created_at,
      nickname: playerFullInfo.nickname,
      statistics: playerFullInfo.statistics,
      clan: clanData || undefined
    };
  }
}

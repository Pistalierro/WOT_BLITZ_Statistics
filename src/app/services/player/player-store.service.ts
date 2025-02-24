import {inject, Injectable, signal} from '@angular/core';
import {apiConfig} from '../../app.config';
import {catchError, firstValueFrom, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {
  ClanAccountInfoResponse,
  ClanInfoResponse,
  PlayerData,
  PlayerInfoResponse,
  PlayerSearchResponse
} from '../../models/player/player-response.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerStoreService {

  nicknameSignal = signal<string | null>(null);
  accountIdSignal = signal<number | null>(null);
  playerDataSignal = signal<PlayerData | null>(null);
  loadingSignal = signal<boolean | null>(null);
  errorSignal = signal<string | null>(null);

  private http = inject(HttpClient);

  async getPlayerData(nickname: string): Promise<void> {
    if (!nickname) return;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.playerDataSignal.set(null); // Очищаем старые данные

    try {
      const url = `${apiConfig.baseUrl}/account/list/?application_id=${apiConfig.applicationId}&search=${nickname}`;
      const res = await firstValueFrom(this.http.get<PlayerSearchResponse>(url).pipe(
        catchError(err => {
          console.error(`❌ Ошибка поиска игрока: ${err.message}`);
          this.errorSignal.set(`Ошибка поиска игрока: ${err.message}`);
          return of(null);
        })
      ));

      if (!res || !res.data || !res.data.length) {
        this.errorSignal.set(`⚠ Игрок с ником ${nickname} не найден`);
        return;
      }

      const accountId = res.data[0].account_id;
      this.accountIdSignal.set(accountId);
      await this.getPlayerDataById(accountId);
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Ошибка ответа от сервера');
      console.log('Ошибка ответа от сервера');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async getPlayerDataById(accountId: number): Promise<void> {
    if (!accountId) {
      console.log('ID игрока отсутствует');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const url = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
      const res = await firstValueFrom(this.http.get<PlayerInfoResponse>(url).pipe(
        catchError(err => {
          console.error(`❌ Ошибка получения данных об игроке: ${err.message}`);
          this.errorSignal.set(`Ошибка получения данных: ${err.message}`);
          return of(null);
        })
      ));

      if (!res || !res.data || !res.data[accountId]) {
        console.warn(`⚠ Данные об игроке ${accountId} не найдены`);
        return;
      }

      const playerData = res.data[accountId];
      const clanData = await this.getPlayersClan(accountId);
      const mergedData: PlayerData = {...playerData, clan: clanData || undefined};
      this.playerDataSignal.set(mergedData);
    } catch (error: any) {
      this.errorSignal.set(`Ошибка получения данных: ${error.message}`);
      console.error(`❌ Ошибка получения данных об игроке: ${error.message}`);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async getPlayersClan(accountId: number): Promise<{ name: string, tag: string } | null> {
    if (!accountId) return null;

    try {
      const clanUrl = `${apiConfig.baseUrl}/clans/accountinfo/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
      const clanRes = await firstValueFrom(this.http.get<ClanAccountInfoResponse>(clanUrl));

      if (!clanRes || !clanRes.data || !clanRes.data[accountId]?.clan_id) {
        console.warn(`⚠ Игрок ${accountId} не состоит в клане`);
        return null;
      }

      const clanId = clanRes.data[accountId].clan_id;
      const clanFullInfoUrl = `${apiConfig.baseUrl}/clans/info/?application_id=${apiConfig.applicationId}&clan_id=${clanId}`;
      const clanFullInfoRes = await firstValueFrom(this.http.get<ClanInfoResponse>(clanFullInfoUrl));

      if (!clanFullInfoRes || !clanFullInfoRes.data || !clanFullInfoRes.data[clanId]) {
        console.warn(`⚠ Клан ${clanId} не найден`);
        return null;
      }

      return {
        name: clanFullInfoRes.data[clanId].name,
        tag: clanFullInfoRes.data[clanId].tag
      };
    } catch (error: any) {
      this.errorSignal.set(`Ошибка загрузки клана: ${error.message}`);
      console.error(`❌ Ошибка загрузки клана: ${error.message}`);
      return null;
    }
  }
}

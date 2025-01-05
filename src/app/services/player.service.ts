import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, of, switchMap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playerData = signal<any | null>(null); // Сигнал для объединенных данных
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private http = inject(HttpClient);

  getPlayerData(nickname: string) {
    this.loading.set(true);
    this.error.set(null);

    // Получаем ID игрока и сразу запускаем второй запрос
    const urlId = `${apiConfig.baseUrl}/account/list/?application_id=${apiConfig.applicationId}&search=${nickname}`;

    this.http.get(urlId).pipe(
      switchMap((res: any) => {
        if (res.data.length > 0) {
          const playerId = res.data[0].account_id;
          return this.getPlayerInfo(playerId); // Второй запрос
        } else {
          this.error.set('Игрок с таким никнеймом не найден');
          return of(null);
        }
      }),
      catchError((err) => {
        this.error.set('Ошибка запроса: ' + err.message);
        return of(null);
      })
    ).subscribe((mergedData) => {
      this.playerData.set(mergedData); // Устанавливаем объединенные данные
      this.loading.set(false);
    });
  }

  private getPlayerInfo(playerId: number) {
    const urlInfo = `${apiConfig.baseUrl}/account/info/?application_id=${apiConfig.applicationId}&account_id=${playerId}&fields=created_at,nickname,statistics.all`;

    return this.http.get(urlInfo).pipe(
      switchMap((res: any) => {
        if (res.data && res.data[playerId]) {
          const playerInfo = res.data[playerId];
          // Объединяем ID и подробную информацию
          return of({
            playerId,
            ...playerInfo,
          });
        } else {
          this.error.set('Информация об игроке не найдена');
          return of(null);
        }
      }),
      catchError((err) => {
        this.error.set('Ошибка получения информации об игроке: ' + err.message);
        return of(null);
      })
    );
  }
}

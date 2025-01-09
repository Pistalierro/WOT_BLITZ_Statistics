import {effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {catchError, firstValueFrom, throwError} from 'rxjs';
import {Tank, TankStatsResponse} from '../models/tanks-response.model';
import {PlayerStoreService} from './player-store.service';

@Injectable({providedIn: 'root'})
export class TanksService {
  tanksList = signal<Tank[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private http = inject(HttpClient);
  private playerStore = inject(PlayerStoreService);
  private tankTypesRu: { [key: string]: string } = {
    'lightTank': 'Лёгкий танк',
    'mediumTank': 'Средний танк',
    'heavyTank': 'Тяжёлый танк',
    'AT-SPG': 'ПТ-САУ',
    'SPG': 'САУ'
  };

  constructor() {
    effect(() => {
      const accountId = this.playerStore.accountId();
      if (accountId) {
        queueMicrotask(() => {
          this.fetchTankData(accountId).then();
        });
      }
    });
  }

  // Метод для получения основной информации о танках
  async fetchTankData(accountId: number) {
    if (!accountId) {
      this.error.set('ID игрока отсутствует');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&fields=tank_id%2C+last_battle_time%2C+all.battles%2C+all.damage_dealt%2C+all.max_frags%2C+all.wins`;
    try {
      const res = await firstValueFrom(
        this.http.get<TankStatsResponse>(url).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения данных о танках: ' + err.message)))
        )
      );

      if (res.status !== 'ok' || !res.data[accountId]) {
        this.error.set('Ошибка: данные о танках отсутствуют');
        return;
      }

      // Фильтруем танки и получаем массив ID танков
      const filteredTanks = res.data[accountId].filter(tank => tank.all.battles > 0);
      const tanksIdArray = filteredTanks.map(tank => tank.tank_id);

      // Получаем свойства танков и объединяем данные
      const tankProps = await this.fetchTanksProps(tanksIdArray);
      const mergedTanks = filteredTanks.map(tank => ({
        ...tank,
        ...(tankProps[tank.tank_id] || {})
      }));

      this.tanksList.set(mergedTanks);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  // Метод для получения свойств танков с разбиением на чанки по 100 танков
  async fetchTanksProps(tanksIdArray: number[]) {
    const chunkSize = 100;
    const chunks = [];

    // Разбиваем массив на чанки по 100 элементов
    for (let i = 0; i < tanksIdArray.length; i += chunkSize) {
      chunks.push(tanksIdArray.slice(i, i + chunkSize));
    }

    try {
      // Делаем несколько запросов параллельно
      const responses = await Promise.all(
        chunks.map(async (chunk) => {
          const chunkIds = chunk.join(',');
          const url = `${apiConfig.baseUrl}/encyclopedia/vehicles/?application_id=${apiConfig.applicationId}&fields=name%2C+images%2C+nation%2C+tier%2C+type&language=ru&tank_id=${chunkIds}`;
          const resProps: any = await firstValueFrom(
            this.http.get(url).pipe(
              catchError(err => throwError(() => new Error('Ошибка получения данных о свойствах танка')))
            )
          );

          if (!resProps || resProps.status !== 'ok') {
            throw new Error('Ошибка: данные о свойствах танков отсутствуют');
          }

          return resProps.data;
        })
      );

      // Объединяем результаты всех запросов в один объект
      return responses.reduce((acc, data) => ({...acc, ...data}), {});
    } catch (err: any) {
      this.error.set(err.message);
      return {};
    }
  }

  getTankTypeRu(type: string): string {
    return this.tankTypesRu[type] || 'Неизвестный тип';
  }

  
}

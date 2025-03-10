import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {collection, doc, Firestore, getDoc, setDoc} from '@angular/fire/firestore';
import {IndexedDbService} from '../../shared/services/data/indexed-db.service';
import {BattlesByTier, BattlesByWinAvgDamage, BattlesByWinRate, TankData, TankStatsResponse} from '../../models/tank/tanks-response.model';
import {SyncService} from '../../shared/services/data/sync.service';
import {catchError, firstValueFrom, lastValueFrom, throwError} from 'rxjs';
import {apiConfig} from '../../app.config';
import {ApiResponse, TankProfile} from '../../models/tank/tank-full-info.model';

@Injectable({
  providedIn: 'root'
})
export class TanksDataService {
  private readonly CHUNK_SIZE = 100;
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private indexedDbService = inject(IndexedDbService);
  private syncService = inject(SyncService);

  async getTanksFromJson(): Promise<TankData[]> {
    let cachedTanks: TankData[] = [];

    try {
      cachedTanks = await this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks');

      if (!Array.isArray(cachedTanks)) {
        console.warn('⚠ cachedTanks не является массивом, присваиваем []');
        cachedTanks = [];
      }
    } catch (error: any) {
      console.error('❌ [TanksJsonService] Ошибка получения jsonTanks из хранилища:', error.message);
      cachedTanks = [];
    }

    if (cachedTanks.length > 0) {
      console.log('✅ [TanksJsonService] jsonTanks загружен из локального хранилища.');
      return cachedTanks;
    }

    try {
      const loadedJson = await lastValueFrom(this.http.get<TankData[]>('/assets/tankList.json'));

      if (!Array.isArray(loadedJson) || loadedJson.length === 0) {
        console.error('❌ [TanksJsonService] Ошибка: tankList.json пуст.');
        return [];
      }

      await this.syncService.saveDataToAllStorages('tanks', 'jsonTanks', loadedJson);
      console.log(`✅ [TanksJsonService] jsonTanks загружен из assets и сохранён: ${loadedJson.length}`);

      return loadedJson;
    } catch (error: any) {
      console.error('❌ [TanksJsonService] Ошибка загрузки tankList.json:', error.message);
      return [];
    }
  }


  async getPlayerTanksStats(accountId: number): Promise<TankStatsResponse['data'][number]> {
    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}`;
    try {
      const res = await lastValueFrom(this.http.get<TankStatsResponse>(url).pipe(
        catchError(err => throwError(() => new Error('Ошибка API: ' + err.message)))
      ));

      if (res.status !== 'ok' || !res.data[accountId]) {
        throw new Error('❌ Ошибка: данные о танках отсутствуют');
      }

      return res.data[accountId];
    } catch (error: any) {
      console.error(`[TanksApiService] Ошибка загрузки данных танков: ${error.message}`);
      throw error;
    }
  }

  async getTankProfile(tankId: number): Promise<TankProfile | null> {
    const url = `${apiConfig.baseUrl}/encyclopedia/vehicleprofile/?application_id=${apiConfig.applicationId}&tank_id=${tankId}`;
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<TankProfile>>(url).pipe(
        catchError(err => throwError(() => new Error('Ошибка API: ' + err.message)))
      ));

      if (res.status !== 'ok' || !res.data || !res.data[tankId]) {
        console.warn(`[TanksApiService] ❌ Ошибка: данные о характеристиках танка отсутствуют`);
        return null;
      }

      const apiTankData = res.data[tankId];
      let jsonTanks = await this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks');
      jsonTanks = Array.isArray(jsonTanks) ? jsonTanks : [];

      const jsonTankData = jsonTanks.find(tank => tank.tank_id === tankId);

      if (!jsonTankData) {
        console.warn(`⚠️ [TanksApiService] Танка с ID ${tankId} нет в JSON.`);
        return apiTankData; // Если в JSON нет, возвращаем только API-данные
      }

      return {
        ...apiTankData,
        tank_id: jsonTankData.tank_id,
        name: jsonTankData.name,
        tier: jsonTankData.tier,
        type: jsonTankData.type,
        nation: jsonTankData.nation,
        is_premium: jsonTankData.is_premium,
        is_collectible: jsonTankData.is_collectible,
        images: {
          normal: jsonTankData.images?.normal ?? '',
          preview: jsonTankData.images?.normal ?? '',
        }
      };

    } catch (error: any) {
      console.error(`[TanksApiService] Ошибка загрузки характеристик танка: ${error.message}`);
      return null;
    }
  }

  async getAllTanksFromApi(): Promise<Set<number>> {
    const url = `${apiConfig.baseUrl}/encyclopedia/vehicles/?application_id=${apiConfig.applicationId}`;

    try {
      const res = await firstValueFrom(
        this.http.get<{ status: string; data: { [key: number]: { tank_id: number } } }>(url).pipe(
          catchError(err => throwError(() => new Error('Ошибка получения данных о танках из Wargaming API: ' + err.message)))
        )
      );

      if (res.status !== 'ok' || !res.data) {
        throw new Error('⚠️ [TanksApiService] API Wargaming не вернул данные.');
      }

      console.log(`📊 [TanksApiService] Загружено танков из API: ${Object.keys(res.data).length}`);
      return new Set(Object.keys(res.data).map(Number)); // Возвращаем Set tank_id
    } catch (error: any) {
      console.error(`[TanksApiService] ❌ Ошибка загрузки списка танков: ${error.message}`);
      throw error;
    }
  }

  calculateWinRateAndAvgDamage(battlesByTier: BattlesByTier, winsByTier: Record<number, number>, damageByTier: Record<number, number>) {
    return Object.keys(battlesByTier).reduce((acc, tier) => {
      const tierNum = Number(tier);
      const totalBattles = battlesByTier[tierNum];

      acc.winRateByTier[tierNum] = totalBattles > 0 ? (winsByTier[tierNum] / totalBattles) * 100 : 0;
      acc.avgDamageByTier[tierNum] = totalBattles > 0 ? damageByTier[tierNum] / totalBattles : 0;

      return acc;
    }, {
      winRateByTier: {} as BattlesByWinRate,
      avgDamageByTier: {} as BattlesByWinAvgDamage
    });
  }

  async loadAndSaveTanks(): Promise<void> {
    try {
      let tanks = await this.syncService.getDataFromAllStorages<TankData[]>('tanks', 'jsonTanks');
      tanks = Array.isArray(tanks) ? tanks : [];

      if (!tanks.length) {
        console.warn('⚠️ [TanksDataService] Танки не были загружены (массив пуст). Сохранение пропускаем.');
        return;
      }
      console.log(`✅ [TanksDataService] Загружено танков: ${tanks.length}`);

      await this.saveTanksInChunksToFirestore(tanks);

      await this.indexedDbService.saveDataToIndexedDB('tanks', 'jsonTanks', tanks);
      console.log('✅ [TanksDataService] Все танки сохранены в IndexedDB (целиком).');

    } catch (error) {
      console.error('❌ [TanksDataService] Ошибка в loadAndSaveTanks:', error);
    }
  }

  private async saveTanksInChunksToFirestore(tanks: TankData[], forceRefresh: boolean = false): Promise<void> {
    const parentDocRef = doc(this.firestore, 'tanks', 'jsonTanks');
    const docSnap = await getDoc(parentDocRef);

    if (!forceRefresh && docSnap.exists()) {
      console.log('✅ [TanksDataService] Документ tanks/jsonTanks УЖЕ существует. Пропускаем запись чанков.');
      return;
    }

    const total = tanks.length;
    const chunkCount = Math.ceil(total / this.CHUNK_SIZE);
    console.log(`📌 [TanksDataService] Сохраняем танки по ${this.CHUNK_SIZE} шт. Итого чанков: ${chunkCount}`);

    const chunksRef = collection(parentDocRef, 'chunks');
    const timestamp = Date.now();

    await setDoc(parentDocRef, {chunkCount, timestamp});
    console.log('ℹ️ [TanksDataService] Записали метаданные в документ: tanks/jsonTanks');

    for (let i = 0; i < chunkCount; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = start + this.CHUNK_SIZE;
      const chunk = tanks.slice(start, end);

      const batchRef = doc(chunksRef, `batch_${i}`);
      await setDoc(batchRef, {data: chunk, timestamp});

      console.log(`✅ [TanksDataService] Чанк #${i + 1}/${chunkCount} (размер: ${chunk.length}) сохранён!`);
    }
    console.log('🎉 [TanksDataService] Все чанки успешно сохранены в Firestore!');
  }
}

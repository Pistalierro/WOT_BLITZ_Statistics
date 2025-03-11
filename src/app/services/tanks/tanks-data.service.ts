import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {collection, doc, Firestore, getDoc, setDoc} from '@angular/fire/firestore';
import {IndexedDbService} from '../../shared/services/data/indexed-db.service';
import {BattlesByTier, BattlesByWinAvgDamage, BattlesByWinRate, TankData, TankStatsResponse} from '../../models/tank/tanks-response.model';
import {SyncService} from '../../shared/services/data/sync.service';
import {catchError, firstValueFrom, lastValueFrom, throwError} from 'rxjs';
import {apiConfig} from '../../app.config';
import {ApiResponse, TankProfile} from '../../models/tank/tank-full-info.model';
import {FirestoreStorageService} from '../../shared/services/data/firestore-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TanksDataService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private indexedDbService = inject(IndexedDbService);
  private syncService = inject(SyncService);
  private firestoreService = inject(FirestoreStorageService);

  async getJsonTanks(): Promise<TankData[]> {
    try {
      const indexedDbTanks = await this.indexedDbService.getDataFromIndexedDB<TankData[]>('tanks', 'jsonTanks');

      if (indexedDbTanks?.data?.length) {
        console.log('✅ [TanksDataService] Данные найдены в IndexedDB, используем их.');
        return indexedDbTanks.data;
      }

      const jsonTanks = await this.syncService.getDataFromAllStorages<TankData[]>(
        'tanks',
        'jsonTanks',
        () => this.getTanksFromJsonFile()
      );

      if (!jsonTanks || jsonTanks.length === 0) {
        console.warn('⚠️ [TanksDataService] Данные о танках отсутствуют в Firestore.');
        return [];
      }

      const parentDocRef = doc(this.firestore, 'tanks', 'jsonTanks');
      const docSnap = await getDoc(parentDocRef);

      if (!docSnap.exists()) {
        console.log('🆕 [TanksDataService] Firestore пуст. Сохраняем...');
        await this.saveJsonTanksToFirestore(jsonTanks);
      }

      await this.indexedDbService.saveDataToIndexedDB('tanks', 'jsonTanks', jsonTanks);
      return jsonTanks;
    } catch (error: any) {
      console.error('❌ [TanksDataService] Ошибка загрузки танков из Firestore:', error.message);
      return [];
    }
  }

  async saveJsonTanksToFirestore(jsonTanks: TankData[]): Promise<void> {
    if (!jsonTanks.length) {
      console.warn('⚠ [TanksDataService] jsonTanksList пуст, сохранение отменено.');
      return;
    }
    const parentDocRef = doc(this.firestore, 'tanks', 'jsonTanks');
    const chunksRef = collection(parentDocRef, 'chunks');
    const chunkSize = 100;
    const chunkCount = Math.ceil(jsonTanks.length / chunkSize);
    const timestamp = Date.now();
    console.log(`📌 [TanksDataService] Сохраняем ${jsonTanks.length} танков чанками по ${chunkSize}.`);

    await setDoc(parentDocRef, {chunkCount, timestamp});

    for (let i = 0; i < chunkCount; i++) {
      const chunk = jsonTanks.slice(i * chunkSize, (i + 1) * chunkSize);
      await setDoc(doc(chunksRef, `batch_${i}`), {data: chunk, timestamp});
      console.log(`✅ [TanksDataService] Чанк #${i + 1}/${chunkCount} сохранён!`);
    }
    console.log('🎉 [TanksDataService] Все чанки успешно сохранены в Firestore!');
  }

  async getTanksFromJsonFile(): Promise<TankData[]> {
    console.log('📂 [TanksDataService] Загружаем танки из JSON-файла...');
    try {
      const response = this.http.get<{ data: Record<string, TankData>; status: string; meta: any }>('/assets/tankList.json');
      console.log('🔄 [TanksDataService] Запрос JSON-файла отправлен...');

      const loadedJson = await lastValueFrom(response);
      console.log('📥 [TanksDataService] Ответ JSON-файла получен:', loadedJson);

      if (!loadedJson || !loadedJson.data) {
        console.warn('⚠️ [TanksDataService] Файл tankList.json пуст или поврежден.');
        return [];
      }

      const tanksArray = Object.values(loadedJson.data);

      if (!Array.isArray(tanksArray) || tanksArray.length === 0) {
        console.warn('⚠️ [TanksDataService] Данные в tankList.json пусты после преобразования.');
        return [];
      }

      console.log(`✅ [TanksDataService] Загружено ${tanksArray.length} танков из JSON.`);
      return tanksArray;
    } catch (error: any) {
      console.error('❌ [TanksDataService] Ошибка загрузки JSON-файла:', error.message);
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
      const jsonTanks = await this.getJsonTanks();
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

}

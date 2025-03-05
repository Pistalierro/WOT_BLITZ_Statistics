import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {collection, doc, Firestore, setDoc} from '@angular/fire/firestore';
import {IndexedDbService} from '../../shared/services/data/indexed-db.service';
import {TankData, TanksJsonResponse} from '../../models/tank/tanks-response.model';
import {lastValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TanksDataService {
  private readonly CHUNK_SIZE = 100;
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private indexedDbService = inject(IndexedDbService);

  async getTanksFromJson(): Promise<TankData[]> {
    try {
      const response = await lastValueFrom(
        this.http.get<TanksJsonResponse>('assets/tankList.json')
      );

      if (!response || !response.data) {
        console.warn('⚠️ [TanksDataService] Похоже, что tankList.json пустой или не содержит поля data');
        return [];
      }

      return Object.keys(response.data).map(key => {
        const item = response.data[key];
        if (!item.tank_id) {
          item.tank_id = Number(key);
        }
        return item;
      });

    } catch (err) {
      console.error('❌ [TanksDataService] Ошибка при загрузке tankList.json:', err);
      return [];
    }
  }

  async loadAndSaveTanks(): Promise<void> {
    try {
      const tanks = await this.getTanksFromJson();
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

  private async saveTanksInChunksToFirestore(tanks: TankData[]): Promise<void> {
    const total = tanks.length;
    const chunkCount = Math.ceil(total / this.CHUNK_SIZE);
    console.log(`📌 [TanksDataService] Сохраняем танки по ${this.CHUNK_SIZE} шт. Итого чанков: ${chunkCount}`);

    const parentDocRef = doc(this.firestore, 'tanks', 'jsonTanks');
    const chunksRef = collection(parentDocRef, 'chunks');
    const timestamp = Date.now();

    await setDoc(parentDocRef, {chunkCount, timestamp,});
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

import {inject, Injectable} from '@angular/core';
import {AppDB, IndexedDbService} from './indexed-db.service';
import {FirestoreStorageService} from './firestore-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private indexedDbService = inject(IndexedDbService);
  private firestoreService = inject(FirestoreStorageService);

  async saveDataToAllStorages<T>(store: keyof AppDB, key: string | number, data: T): Promise<void> {
    if (!data) {
      console.warn(`⚠ Нет данных для сохранения: ${key}`);
      return;
    }

    try {
      await Promise.all([
        this.indexedDbService.saveDataToIndexedDB(store, key, data),
        this.firestoreService.saveDataToFirestore(store, key.toString(), Array.isArray(data) ? data : [data]) // 🔥 Приводим data к массиву
      ]);
      console.log(`✅ Данные успешно сохранены для ключа "${key}" в хранилище "${store}"`);
    } catch (error: any) {
      console.error(`❌ Ошибка при сохранении данных для ключа "${key}" в хранилище "${store}":`, error.message);
    }
  }

  async getDataFromAllStorages<T extends any[]>(
    store: keyof AppDB,
    key: string | number,
    fetchApiFn?: () => Promise<T>
  ): Promise<T> {
    try {
      const indexedDbRecord = await this.indexedDbService.getDataFromIndexedDB<T>(store, key);

      if (indexedDbRecord) {
        const {data, timestamp} = indexedDbRecord;

        if (data.length > 0) {
          return data;
        }

        console.log(`⚠️ [Sync] Данные "${key}" в IndexedDB пусты. Запрашиваем Firestore...`);
      } else {
        console.log(`⚠️ [Sync] Данные "${key}" не найдены в IndexedDB. Переходим к Firestore...`);
      }

      const firestoreResult = await this.firestoreService.loadDataFromFirestore<T>(store, key.toString());
      if (firestoreResult && firestoreResult.data.length > 0) {
        console.log(`📥 [Sync] Данные "${key}" получены из Firestore (хранилище: ${store}) с timestamp: ${firestoreResult.timestamp}. Сохраняем в IndexedDB...`);

        await this.indexedDbService.saveDataToIndexedDB(store, key, firestoreResult.data, firestoreResult.timestamp);

        return firestoreResult.data;
      }

      if (fetchApiFn) {
        console.warn(`⚠️ [Sync] Данные "${key}" не найдены ни в IndexedDB, ни в Firestore. Вызываем API...`);
        const apiData = await fetchApiFn();
        if (apiData && apiData.length > 0) {
          const now = Date.now();
          await this.indexedDbService.saveDataToIndexedDB(store, key, apiData, now);
          console.log(`✅ [Sync] Данные "${key}" загружены из API и сохранены в IndexedDB с timestamp: ${now}`);
          return apiData;
        }
        console.warn(`❌ [Sync] API вернул пустоту для "${key}". Возвращаем [].`);
        return [] as unknown as T;
      }

      console.warn(`⚠️ [Sync] Данные "${key}" не найдены нигде (IndexedDB, Firestore, API). Возвращаем [].`);
      return [] as unknown as T;

    } catch (error: any) {
      console.error(`❌ [Sync] Ошибка при получении данных "${key}" (хранилище: ${store}):`, error);
      return [] as unknown as T;
    }
  }

  isDataFresh(timestamp: number): boolean {
    const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 часов в миллисекундах
    const now = Date.now();
    return now - timestamp <= TWELVE_HOURS;
  }
}

import {inject, Injectable} from '@angular/core';
import {AppDB, IndexedDbService} from './indexed-db.service';
import {FirestoreStorageService} from './firestore-storage.service';

/** Функция проверяет, "пустые" ли данные (пустой массив/объект/строка) */
function isEmptyData(data: any): boolean {
  if (data == null) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (typeof data === 'object' && Object.keys(data).length === 0) return true;
  if (typeof data === 'string' && data.trim().length === 0) return true;
  return false;
}

/** Возвращаем "пустые" данные, если ничего не нашли */
function getEmptyData<T>(): T {
  // Обычно хотим вернуть либо [] (если чаще ожидаем массив),
  // либо {} if object. Можешь оставить [], чтобы точно не было .length ошибки
  return [] as unknown as T;
}

@Injectable({providedIn: 'root'})
export class SyncService {
  private indexedDb = inject(IndexedDbService);
  private firestore = inject(FirestoreStorageService);

  /** Сохраняем одновременно в IndexedDB и Firestore */
  async saveDataToAllStorages<T>(store: keyof AppDB, key: string | number, data: T): Promise<void> {
    if (data == null) {
      console.warn(`⚠ [Sync] Нет данных для сохранения (store='${store}', key='${key}')`);
      return;
    }
    try {
      await this.indexedDb.saveDataToIndexedDB(store, key, data);
      await this.firestore.saveDataToFirestore(store, key.toString(), data);
      // console.log(`✅ [Sync] '${store}'/'${key}' успешно сохранено везде.`);
    } catch (err: any) {
      console.error(`❌ [Sync] Ошибка при saveDataToAllStorages('${store}', '${key}')`, err.message);
    }
  }

  /** Загружаем, сначала из IndexedDB, если нет – из Firestore, если нет – API, иначе пустое  */
  async getDataFromAllStorages<T>(
    store: keyof AppDB,
    key: string | number,
    fetchApiFn?: () => Promise<T>
  ): Promise<T> {
    try {
      // 1) IndexedDB
      const fromIndexedDb = await this.indexedDb.getDataFromIndexedDB<T>(store, key);
      if (fromIndexedDb && !isEmptyData(fromIndexedDb.data)) {
        console.log(`✅ [Sync] '${key}' получены из IndexedDB (store='${store}'), ts=${fromIndexedDb.timestamp}`);
        return fromIndexedDb.data;
      }
      console.log(`⚠ [Sync] '${key}' нет в IndexedDB (или пусты). Переходим к Firestore...`);

      // 2) Firestore
      const fromFirestore = await this.firestore.loadDataFromFirestore<T>(store, key.toString());
      if (fromFirestore && !isEmptyData(fromFirestore.data)) {
        console.log(`📥 [Sync] '${key}' получены из Firestore (store='${store}'), ts=${fromFirestore.timestamp}. Сохраняем в IndexedDB...`);
        await this.indexedDb.saveDataToIndexedDB(store, key, fromFirestore.data, fromFirestore.timestamp);
        return fromFirestore.data;
      }

      // 3) Если есть функция загрузки из API
      if (fetchApiFn) {
        console.warn(`⚠ [Sync] '${key}' нет ни в IndexedDB, ни в Firestore. Вызываем fetchApiFn...`);
        const apiData = await fetchApiFn();
        if (!isEmptyData(apiData)) {
          const now = Date.now();
          await this.indexedDb.saveDataToIndexedDB(store, key, apiData, now);
          console.log(`✅ [Sync] '${key}' загружены из API и сохранены в IndexedDB (ts=${now}).`);
          return apiData;
        }
        console.warn(`❌ [Sync] API вернул пустые данные для '${key}'.`);
        return getEmptyData<T>();
      }

      // 4) Иначе возвращаем пустое
      console.warn(`⚠ [Sync] '${key}' не найдены ни в IndexedDB, ни в Firestore, ни в API. Возвращаем пустые.`);
      return getEmptyData<T>();
    } catch (error: any) {
      console.error(`❌ [Sync] Ошибка getDataFromAllStorages('${store}', '${key}'):`, error);
      return getEmptyData<T>();
    }
  }

  /** Пример: проверка "свежести" данных (при желании) */
  isDataFresh(timestamp: number, maxAgeHours = 12): boolean {
    const now = Date.now();
    return (now - timestamp) <= (maxAgeHours * 60 * 60 * 1000);
  }
}

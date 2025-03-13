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
    fetchApiFn?: () => Promise<T>,
    isFreshNeeded: boolean = false,
    maxAgeHours: number = 12,
  ): Promise<T> {
    try {
      // 1) Проверяем IndexedDB
      const fromIndexedDb = await this.indexedDb.getDataFromIndexedDB<T>(store, key);
      if (fromIndexedDb && !isEmptyData(fromIndexedDb.data)) {
        console.log(`✅ [Sync] '${key}' получены из IndexedDB (store='${store}'), ts=${fromIndexedDb.timestamp}`);
        if (isFreshNeeded) {
          if (this.isDataFresh(fromIndexedDb.timestamp, maxAgeHours)) {
            console.log(`⏰ [Sync] '${key}' в IndexedDB свежие – возвращаем.`);
            return fromIndexedDb.data;
          } else {
            console.warn(`⚠ [Sync] '${key}' в IndexedDB протухли – ищем дальше...`);
          }
        } else {
          return fromIndexedDb.data;
        }
      } else {
        console.log(`⚠ [Sync] '${key}' нет в IndexedDB (или пусты). Идём в Firestore...`);
      }

      // 2) Проверяем Firestore
      const fromFirestore = await this.firestore.loadDataFromFirestore<T>(store, key.toString());
      if (fromFirestore && !isEmptyData(fromFirestore.data)) {
        console.log(`📥 [Sync] '${key}' получены из Firestore, ts=${fromFirestore.timestamp}`);
        if (isFreshNeeded) {
          if (this.isDataFresh(fromFirestore.timestamp, maxAgeHours)) {
            console.log(`⏰ [Sync] '${key}' в Firestore свежие – пишем в IndexedDB и возвращаем.`);
            await this.indexedDb.saveDataToIndexedDB(store, key, fromFirestore.data, fromFirestore.timestamp);
            return fromFirestore.data;
          } else {
            console.warn(`⚠ [Sync] '${key}' в Firestore устарели – пойдём в API...`);
          }
        } else {
          await this.indexedDb.saveDataToIndexedDB(store, key, fromFirestore.data, fromFirestore.timestamp);
          return fromFirestore.data;
        }
      } else {
        console.log(`⚠ [Sync] '${key}' нет в Firestore (или пустые).`);
      }

      // 3) Данных нет или устарели, пробуем API
      if (fetchApiFn) {
        console.warn(`⚠ [Sync] '${key}' нет/устарели в БД. Вызываем fetchApiFn...`);
        const apiData = await fetchApiFn();
        if (!isEmptyData(apiData)) {
          await this.saveDataToAllStorages(store, key, apiData);
          console.log(`✅ [Sync] '${key}' загружены из API и сохранены в БД.`);
          return apiData;
        }
        console.warn(`❌ [Sync] API вернул пустые данные для '${key}'. Возвращаем []...`);
        return getEmptyData<T>();
      }

      // 4) Если fetchApiFn не задан или данные пустые даже из API
      console.warn(`⚠ [Sync] '${key}' нет ни в IndexedDB, ни в Firestore, ни в API. Возвращаем [].`);
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

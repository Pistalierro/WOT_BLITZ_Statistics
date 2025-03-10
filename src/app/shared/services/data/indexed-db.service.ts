import {Injectable} from '@angular/core';
import Dexie, {Table} from 'dexie';
import {BasicClanData} from '../../../models/clan/clan-response.model';

// Общая структура записи
interface IStoreRecord {
  key: string | number;
  data: any;
  timestamp: number;
}

// Dexie-хранилище
export class AppDB extends Dexie {
  clans!: Table<IStoreRecord, string | number>;
  tanks!: Table<IStoreRecord, string | number>;

  constructor() {
    super('AppDB');
    this.version(1).stores({
      clans: '&key',
      tanks: '&key',
    });
  }
}

@Injectable({providedIn: 'root'})
export class IndexedDbService {
  private db: AppDB;

  constructor() {
    this.db = new AppDB();
  }

  /** Сохраняем данные (любой тип) в IndexedDB */
  async saveDataToIndexedDB<T>(
    store: keyof AppDB,
    key: string | number,
    data: T,
    timestamp?: number
  ): Promise<void> {
    if (data == null) {
      console.warn(`⚠ [IndexedDB] Пустые данные, сохранять нечего (store: ${store}, key: ${key})`);
      return;
    }
    if (!key && key !== 0) {
      console.error(`❌ [IndexedDB] Неверный ключ: '${key}' (store: ${store})`);
      return;
    }

    try {
      const finalTimestamp = timestamp ?? Date.now();
      const record: IStoreRecord = {
        key,
        data: sanitize(data),
        timestamp: finalTimestamp
      };
      const table = this.db[store] as Table<IStoreRecord, string | number>;
      await table.put(record);
      // console.log(`✅ [IndexedDB] '${store}'/'${key}' сохранено.`);
    } catch (error: any) {
      console.error(`❌ [IndexedDB] Ошибка при сохранении '${store}'/'${key}':`, error.message);
    }
  }

  /** Загружаем данные из IndexedDB */
  async getDataFromIndexedDB<T>(
    store: keyof AppDB,
    key: string | number
  ): Promise<{ data: T; timestamp: number } | null> {
    try {
      const table = this.db[store] as Table<IStoreRecord, string | number>;
      const record = await table.get(key);

      if (!record) {
        // console.warn(`⚠ [IndexedDB] Нет данных в '${store}'/'${key}'`);
        return null;
      }
      return {
        data: record.data as T,
        timestamp: record.timestamp
      };
    } catch (error: any) {
      console.error(`❌ [IndexedDB] Ошибка при загрузке '${store}'/'${key}':`, error.message);
      return null;
    }
  }

  /** Пример поиска по кланам */
  async findClansByNameOrTag(searchTerm: string): Promise<BasicClanData[]> {
    // ...
    // Эта часть может не меняться
    return [];
  }

  async getRecord(store: keyof AppDB, key: string | number): Promise<IStoreRecord | undefined> {
    try {
      const table = this.db[store] as Table<IStoreRecord, string | number>;
      const record = await table.get(key);
      if (record) {
        console.log(`📥 [IndexedDB] Данные найдены для ключа "${key}" в "${store}":`, record);
        return record;
      } else {
        console.warn(`⚠️ [IndexedDB] Данные по ключу "${key}" в хранилище "${store}" не найдены.`);
        return undefined;
      }
    } catch (error) {
      console.error(`❌ [IndexedDB] Ошибка при получении данных (store: ${store}, key: ${key}):`, error);
      return undefined;
    }
  }
}

function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

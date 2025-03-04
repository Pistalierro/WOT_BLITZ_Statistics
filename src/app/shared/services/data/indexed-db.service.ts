import {Injectable} from '@angular/core';
import Dexie, {Table} from 'dexie';
import {BasicClanData} from '../../../models/clan/clan-response.model';

interface IStoreRecord {
  key: string | number;  // первичный ключ
  data: any;             // любые данные
  timestamp: number;     // дата сохранения
}

export class AppDB extends Dexie {
  clans!: Table<IStoreRecord, string | number>;
  tanks!: Table<IStoreRecord, string | number>;

  constructor() {
    super('AppDB');

    this.version(1).stores({
      // &key => key является primaryKey
      clans: '&key',
      tanks: '&key',
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  db: AppDB;

  constructor() {
    this.db = new AppDB();
  }

  async saveDataToIndexedDB<T>(
    store: keyof AppDB,
    key: string | number,
    data: T,
    timestamp?: number
  ): Promise<void> {
    try {
      if (data === null || data === undefined) {
        console.warn(`⚠️ [IndexedDB] Пустые данные. Сохранение отменяется (store: ${store}, key: ${key}).`);
        return;
      }

      if (!key && key !== 0) {
        console.warn(`⚠️ [IndexedDB] Ошибка: передан некорректный ключ (store: ${store}).`);
        return;
      }

      const payload: IStoreRecord = {key, data, timestamp: timestamp ?? Date.now()};
      const table = this.db[store] as Table<IStoreRecord, string | number>;
      if (!table) {
        console.error(`❌ [IndexedDB] Ошибка: таблица "${store}" не найдена.`);
        return;
      }

      await table.put(payload);
      console.log(`✅ [IndexedDB] Данные успешно сохранены в "${store}" с ключом "${key}"`);
    } catch (error) {
      console.error(`❌ [IndexedDB] Ошибка при сохранении данных (store: ${store}, key: ${key}):`, error);
    }
  }

  async getDataFromIndexedDB<T>(
    store: keyof AppDB,
    key: string | number
  ): Promise<{ data: T; timestamp: number } | null> {
    try {
      const table = this.db[store] as Table<IStoreRecord, string | number>;
      const record = await table.get(key);

      if (!record) {
        console.warn(`⚠️ [IndexedDB] Данные по ключу "${key}" в хранилище "${store}" не найдены.`);
        return null;
      }

      return {
        data: record.data as T,
        timestamp: record.timestamp
      };
    } catch (error) {
      console.error(`❌ [IndexedDB] Ошибка при получении данных (store: ${store}, key: ${key}):`, error);
      return null;
    }
  }

  async findClansByNameOrTag(searchTerm: string): Promise<BasicClanData[]> {
    console.log(`🔎 Поиск в IndexedDB (store: "clans"): "${searchTerm}"`);

    // Получаем все записи из таблицы `clans`
    const records = await this.db.clans.toArray();  // => IStoreRecord[]

    // Собираем все "data" из каждой записи в один общий массив
    // Ведь в одной записи мог быть массив кланов, а в другой – ещё массив, итд.
    const allClans = records.flatMap(record => {
      // если record.data – это массив, возьмём элементы
      if (Array.isArray(record.data)) {
        return record.data;
      }
      // если один объект, то обернём в массив
      return record.data ? [record.data] : [];
    });

    // Фильтруем по searchTerm, допустим, по имени/тегу
    const lowerTerm = searchTerm.trim().toLowerCase();

    // если строка поиска пустая, возвращаем всех
    if (!lowerTerm) {
      console.log(`✅ [IndexedDB] Найдено кланов (без фильтра): ${allClans.length}`, allClans);
      return allClans;
    }

    const filtered = allClans.filter((clan: BasicClanData) => {
      // подстраховка на случай, если нет name или tag
      const nameMatches = clan.name?.toLowerCase().includes(lowerTerm);
      const tagMatches = clan.tag?.toLowerCase().includes(lowerTerm);
      return nameMatches || tagMatches;
    });

    console.log(`✅ [IndexedDB] Найдено кланов: ${filtered.length}`, filtered);
    return filtered;
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

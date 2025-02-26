import {Injectable} from '@angular/core';
import Dexie, {Table} from 'dexie';
import {BasicClanData, KeyValueRecord} from '../../models/clan/clan-response.model';

export class ClanDB extends Dexie {
  clans!: Table<BasicClanData, number>;
  keyValue!: Table<KeyValueRecord, string>;

  constructor() {
    super('ClanDB');
    this.version(1).stores({
      clans: 'clan_id, name, tag',
      keyValue: 'key'
    });
  }
}


@Injectable({
  providedIn: 'root'
})

export class ClanIndexedDbService {
  db: ClanDB;

  constructor() {
    this.db = new ClanDB();
  }

  async saveDataToIndexedDB<T>(key: string, data: T[], timestamp?: number): Promise<void> {
    try {
      if (!data || data.length === 0) {
        console.warn('📢 Передан пустой массив, сохранение не выполняется.');
        return;
      }

      const payload = {data, timestamp: timestamp || Date.now()}; // Используем переданную метку или текущее время
      await this.db.keyValue.put({key, ...payload});
      console.log(`✅ Данные сохранены в keyValue с ключом "${key}"`);
    } catch (error) {
      console.error('❌ Ошибка при сохранении данных в IndexedDB:', error);
    }
  }

  async getDataFromIndexedDB<T>(key: string): Promise<{ data: T[]; timestamp: number } | null> {
    try {
      const record = await this.db.keyValue.get(key);
      if (record) {
        return {
          data: Array.isArray(record.data) ? record.data : [],
          timestamp: record.timestamp || Date.now(),
        };
      }

      const clans = await this.db.clans.toArray();
      if (clans.length > 0) {
        console.log(`📥 Данные получены из таблицы "clans", количество записей: ${clans.length}`);
        return {data: clans as T[], timestamp: Date.now()};
      }

      console.warn(`⚠️ Данные по ключу "${key}" не найдены.`);
      return null;
    } catch (error) {
      console.error('❌ Ошибка при получении данных из IndexedDB:', error);
      return null;
    }
  }

  async findClansByNameOrTag(searchTerm: string): Promise<BasicClanData[]> {
    console.log(`🔎 Поиск в IndexedDB: "${searchTerm}"`);

    const results = await this.db.clans
      .where('tag')
      .startsWithIgnoreCase(searchTerm)
      .or('name')
      .startsWithIgnoreCase(searchTerm)
      .toArray();

    console.log(`✅ IndexedDB вернул ${results.length} кланов`, results);
    return results;
  }

  async getRecord(key: string): Promise<KeyValueRecord | undefined> {
    return this.db.keyValue.get(key);
  }
}


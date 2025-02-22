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

  async saveDataToIndexedDB<T>(key: string, data: T[]): Promise<void> {
    try {
      if (data.length === 0) {
        console.warn('📢 Передан пустой массив, сохранение не выполняется.');
        return;
      }

      if (typeof data[0] === 'object') {
        await this.db.clans.bulkPut(data as BasicClanData[]);
        console.log(`✅ Данные сохранены в таблицу "clans", количество записей: ${data.length}`);
      } else if (typeof data[0] === 'number') {
        await this.db.keyValue.put({key, data, timestamp: Date.now()});
        console.log(`✅ Числовой массив сохранен в keyValue с ключом "${key}"`);
      } else {
        console.error('❌ Неподдерживаемый тип данных, сохранение невозможно.');
      }
    } catch (error) {
      console.error('❌ Ошибка при сохранении данных в IndexedDB:', error);
    }
  }

  async getDataFromIndexedDB<T>(key: string): Promise<T[]> {
    try {
      const record = await this.db.keyValue.get(key);
      if (record) {
        return Array.isArray(record.data) ? record.data : []; // Гарантируем массив
      }

      const clans = await this.db.clans.toArray();
      if (clans.length > 0) {
        console.log(`📥 Данные получены из таблицы "clans", количество записей: ${clans.length}`);
        return clans as T[];
      }

      console.warn(`⚠️ Данные по ключу "${key}" не найдены.`);
      return [];
    } catch (error) {
      console.error('❌ Ошибка при получении данных из IndexedDB:', error);
      return [];
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


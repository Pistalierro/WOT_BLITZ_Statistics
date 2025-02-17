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
  private db: ClanDB;

  constructor() {
    this.db = new ClanDB();
  }

  async addClans(clans: BasicClanData[]): Promise<void> {
    await this.db.clans.bulkAdd(clans);
  }

  async getAllClans(): Promise<BasicClanData[]> {
    return this.db.clans.toArray();
  }

  async clearAllClans(): Promise<void> {
    await this.db.clans.clear();
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


  async putRecord(key: string, data: any): Promise<void> {
    const record: KeyValueRecord = {key, data, timestamp: Date.now()};
    await this.db.keyValue.put(record);
  }

  async getRecord(key: string): Promise<KeyValueRecord | undefined> {
    return this.db.keyValue.get(key);
  }

  async removeRecord(key: string): Promise<void> {
    await this.db.keyValue.delete(key);
  }
}


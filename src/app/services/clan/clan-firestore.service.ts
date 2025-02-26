import {inject, Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, setDoc} from '@angular/fire/firestore';
import {Auth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ClanFirestoreService {
  private firestore = inject(Firestore);
  private batchSize = 9000; // 🔥 Ограничение Firestore (максимум 1Мб на документ)
  private auth = inject(Auth);

  async saveData<T extends any[]>(key: string, data: T): Promise<void> {
    if (!data || data.length === 0) {
      console.warn(`⚠ Нет данных для сохранения в Firestore: ${key}`);
      return;
    }

    try {
      const timestamp = Date.now(); // Добавляем метку времени
      const payload = {data: [...data], timestamp}; // Формируем объект для сохранения

      if (data.length > this.batchSize) {
        await this.saveLargeData(key, payload);
      } else {
        const ref = doc(this.firestore, 'clanData', key);
        await setDoc(ref, payload);
      }
    } catch (error: any) {
      console.error(`❌ Ошибка при сохранении '${key}' в Firestore:`, error.message);
    }
  }

  async loadData<T extends any[]>(key: string): Promise<{ data: T; timestamp: number } | null> {
    try {
      const ref = doc(this.firestore, 'clanData', key);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        return snapshot.data() as { data: T; timestamp: number };
      }

      return await this.loadLargeData<T>(key);
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${key}' из Firestore:`, error.message);
      return null;
    }
  }


  private async saveLargeData<T extends any[]>(key: string, payload: { data: T; timestamp: number }): Promise<void> {
    const batchCount = Math.ceil(payload.data.length / this.batchSize);
    console.log(`📌 Сохраняем '${key}' в Firestore по ${this.batchSize} элементов. Всего частей: ${batchCount}`);

    console.log('Firestore запрос! Пользователь:', this.auth.currentUser); // 🔥 Лог пользователя

    for (let i = 0; i < batchCount; i++) {
      const chunk = payload.data.slice(i * this.batchSize, (i + 1) * this.batchSize);
      const chunksRef = collection(this.firestore, 'clanData', key, 'chunks');
      const ref = doc(chunksRef, `batch_${i}`);
      await setDoc(ref, {data: chunk, timestamp: payload.timestamp}); // Сохраняем с меткой времени

      console.log(`✅ Сохранен батч ${i + 1}/${batchCount} (${chunk.length} элементов)`);
    }
  }

  private async loadLargeData<T extends any[]>(key: string): Promise<{ data: T; timestamp: number } | null> {
    const combinedData: T = [] as unknown as T;
    const chunksRef = collection(this.firestore, 'clanData', key, 'chunks');

    console.log(`📌 Загружаем '${key}' из Firestore частями...`);

    try {
      const snapshot = await getDocs(chunksRef);

      if (snapshot.empty) {
        console.warn(`⚠ В Firestore нет данных для '${key}'`);
        return null;
      }

      let timestamp: number | null = null;

      snapshot.forEach(doc => {
        const chunk = doc.data()['data'] as unknown as T;
        combinedData.push(...chunk);

        // Сохраняем метку времени из первого документа
        if (timestamp === null) {
          timestamp = doc.data()['timestamp'];
        }
      });

      if (timestamp === null) {
        console.warn(`⚠ Не удалось получить метку времени для '${key}'`);
        return null;
      }

      console.log(`🎉 Все части '${key}' загружены (${combinedData.length} элементов)`);
      return {data: combinedData, timestamp};
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${key}' из Firestore:`, error.message);
      return null;
    }
  }
}

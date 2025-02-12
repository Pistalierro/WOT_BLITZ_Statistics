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
      if (data.length > this.batchSize) {
        await this.saveLargeData(key, data);
      } else {
        const ref = doc(this.firestore, 'clanData', key);
        await setDoc(ref, {data: [...data]}); // 👈 Копируем массив, чтобы избежать мутации
      }
    } catch (error: any) {
      console.error(`❌ Ошибка при сохранении '${key}' в Firestore:`, error.message);
    }
  }

  async loadData<T extends any[]>(key: string): Promise<T> {
    try {
      const ref = doc(this.firestore, 'clanData', key);
      const snapshot = await getDoc(ref);

      if (snapshot.exists() && snapshot.data()?.['data']) {
        return snapshot.data()['data'] as unknown as T; // 👈 Безопасное приведение к массиву
      }

      return await this.loadLargeData<T>(key);
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${key}' из Firestore:`, error.message);
      return [] as unknown as T; // 🔥 Гарантированно возвращаем массив
    }
  }

  async loadCollection<T extends any[]>(key: string): Promise<T> {
    try {
      const firestoreData = await this.loadData<T>(key);
      if (firestoreData.length > 0) {
        return firestoreData;
      } else {
        console.warn(`⚠ В Firestore нет данных '${key}', загружаем заново`);
        return [] as unknown as T;
      }
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${key}' из Firestore:`, error.message);
      return [] as unknown as T;
    }
  }

  private async saveLargeData<T extends any[]>(key: string, data: T): Promise<void> {
    const batchCount = Math.ceil(data.length / this.batchSize);
    console.log(`📌 Сохраняем '${key}' в Firestore по ${this.batchSize} элементов. Всего частей: ${batchCount}`);

    console.log('Firestore запрос! Пользователь:', this.auth.currentUser); // 🔥 Лог пользователя


    for (let i = 0; i < batchCount; i++) {
      const chunk = data.slice(i * this.batchSize, (i + 1) * this.batchSize);
      const chunksRef = collection(this.firestore, 'clanData', key, 'chunks');
      const ref = doc(chunksRef, `batch_${i}`);
      await setDoc(ref, {data: chunk});

      console.log(`✅ Сохранен батч ${i + 1}/${batchCount} (${chunk.length} элементов)`);
    }
  }

  private async loadLargeData<T extends any[]>(key: string): Promise<T> {
    const combinedData: T = [] as unknown as T;
    const chunksRef = collection(this.firestore, 'clanData', key, 'chunks');

    console.log(`📌 Загружаем '${key}' из Firestore частями...`);

    try {
      const snapshot = await getDocs(chunksRef);

      if (snapshot.empty) {
        console.warn(`⚠ В Firestore нет данных для '${key}'`);
        return [] as unknown as T;
      }

      snapshot.forEach(doc => {
        const chunk = doc.data()['data'] as unknown as T;
        combinedData.push(...chunk);
        console.log(`✅ Загружен батч '${doc.id}' (${chunk.length} элементов)`);
      });

      console.log(`🎉 Все части '${key}' загружены (${combinedData.length} элементов)`);
      return combinedData;
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${key}' из Firestore:`, error.message);
      return [] as unknown as T;
    }
  }
}

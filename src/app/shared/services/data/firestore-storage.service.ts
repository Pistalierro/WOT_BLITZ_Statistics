import {inject, Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, setDoc} from '@angular/fire/firestore';
import {Auth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirestoreStorageService {

  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private batchSize = 9000;

  async saveDataToFirestore<T extends any[]>(collectionName: string, documentId: string, data: T): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('❌ Ошибка: пользователь не аутентифицирован!');
      return;
    }
    console.log('✅ Пользователь залогинен:', user.uid);

    if (!data || data.length === 0) {
      console.warn(`⚠ Нет данных для сохранения в Firestore: ${collectionName}/${documentId}`);
      return;
    }

    try {
      const timestamp = Date.now();
      const payload = sanitizeData({data, timestamp});

      console.log(`📌 Размер данных: ${JSON.stringify(payload).length / 1024} KB`);

      if (data.length > this.batchSize) {
        await this.saveLargeData(collectionName, documentId, payload);
      } else {
        const ref = doc(this.firestore, collectionName, documentId);
        await setDoc(ref, payload);
        console.log(`✅ Документ '${collectionName}/${documentId}' успешно сохранён (целиком).`);
      }
    } catch (error: any) {
      console.error(`❌ Ошибка при сохранении '${collectionName}/${documentId}' в Firestore:`, error.message);
    }
  }

  async loadDataFromFirestore<T extends any[]>(
    collectionName: string,
    documentId: string
  ): Promise<{ data: T; timestamp: number } | null> {
    try {
      const ref = doc(this.firestore, collectionName, documentId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        console.log(`✅ Документ '${collectionName}/${documentId}' найден (целиком).`);
        return snapshot.data() as { data: T; timestamp: number };
      }

      return await this.loadLargeData<T>(collectionName, documentId);
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${collectionName}/${documentId}' из Firestore:`, error.message);
      return null;
    }
  }

  private async saveLargeData<T extends any[]>(collectionName: string, documentId: string, payload: {
    data: T;
    timestamp: number
  }): Promise<void> {
    const batchCount = Math.ceil(payload.data.length / this.batchSize);
    console.log(`📌 Сохраняем '${collectionName}/${documentId}' по ~${this.batchSize} элементов. Всего частей: ${batchCount}`);

    const docRef = doc(this.firestore, collectionName, documentId);
    const chunksRef = collection(docRef, 'chunks');

    for (let i = 0; i < batchCount; i++) {
      const chunkSlice = payload.data.slice(i * this.batchSize, (i + 1) * this.batchSize);
      const chunk = sanitizeData(chunkSlice);

      const ref = doc(chunksRef, `batch_${i}`);
      await setDoc(ref, {data: chunk, timestamp: payload.timestamp});
      console.log(`✅ Сохранён батч ${i + 1}/${batchCount} (${chunkSlice.length} элементов)`);
    }

    console.log(`🎉 Все батчи для '${collectionName}/${documentId}' сохранены.`);
  }

  private async loadLargeData<T extends any[]>(
    collectionName: string,
    documentId: string
  ): Promise<{ data: T; timestamp: number } | null> {
    console.log(`📌 Загружаем '${collectionName}/${documentId}' из Firestore частями...`);

    const combinedData: T = [] as unknown as T;
    const docRef = doc(this.firestore, collectionName, documentId);
    const chunksRef = collection(docRef, 'chunks');

    try {
      const snapshot = await getDocs(chunksRef);

      if (snapshot.empty) {
        console.warn(`⚠ В Firestore нет данных (ни целикового документа, ни chunks) для '${collectionName}/${documentId}'`);
        return null;
      }

      let timestamp: number | null = null;

      snapshot.forEach(docSnap => {
        const chunk = docSnap.data()['data'] as T;
        combinedData.push(...chunk);

        if (timestamp === null) {
          timestamp = docSnap.data()['timestamp'];
        }
      });

      if (timestamp === null) {
        console.warn(`⚠ Не удалось получить метку времени для '${collectionName}/${documentId}'`);
        return null;
      }

      console.log(`🎉 Все части '${collectionName}/${documentId}' загружены (${combinedData.length} элементов)`);
      return {data: combinedData, timestamp};
    } catch (error: any) {
      console.error(`❌ Ошибка при загрузке '${collectionName}/${documentId}' из Firestore:`, error.message);
      return null;
    }
  }
}

function sanitizeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

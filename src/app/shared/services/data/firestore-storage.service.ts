import {inject, Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, setDoc} from '@angular/fire/firestore';
import {Auth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirestoreStorageService {

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private readonly BATCH_SIZE = 9000;

  async saveDataToFirestore<T>(collectionName: string, documentId: string, data: T): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('❌ Ошибка: пользователь не аутентифицирован!');
      return;
    }

    if (data == null) {
      console.warn(`⚠ Нет данных для сохранения в Firestore: ${collectionName}/${documentId}`);
      return;
    }

    try {
      const timestamp = Date.now();
      // "Санитизируем" (убираем лишние ссылки, undefined и т.п.)
      const payload = sanitize({data, timestamp});

      // Если это массив И он крупнее BATCH_SIZE => чанк
      if (Array.isArray(data) && data.length > this.BATCH_SIZE) {
        await this.saveLargeArray(collectionName, documentId, payload);
      } else {
        // Иначе сохраняем одним документом
        const ref = doc(this.firestore, collectionName, documentId);
        await setDoc(ref, payload);
        console.log(`✅ [Firestore] '${collectionName}/${documentId}' сохранён (целиком).`);
      }
    } catch (error: any) {
      console.error(`❌ [Firestore] Ошибка сохранения '${collectionName}/${documentId}':`, error.message);
    }
  }

  async loadDataFromFirestore<T>(collectionName: string, documentId: string): Promise<{ data: T; timestamp: number } | null> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        console.log(`✅ [Firestore] '${collectionName}/${documentId}' найден (целиком).`);

        const docData = snap.data() as { data: T; timestamp: number };
        if (Array.isArray(docData?.data) && docData.data.length > 0) {
          console.log(`📋 [Firestore] '${collectionName}/${documentId}' содержит ${docData.data.length} элементов.`);
          return docData;
        }

        console.warn(`⚠ [Firestore] '${collectionName}/${documentId}' найден, но data пуст.`);
      } else {
        console.log(`⚠ '${collectionName}/${documentId}' нет цельного документа. Пробуем chunks...`);
      }

      // Если цельного документа нет или data пустая → грузим чанки
      return await this.loadLargeArray<T>(collectionName, documentId);

    } catch (error: any) {
      console.error(`❌ [Firestore] Ошибка загрузки '${collectionName}/${documentId}':`, error.message);
      return null;
    }
  }


  /**
   * Приватный метод — сохранение большого массива чанками
   */
  private async saveLargeArray<T>(
    collectionName: string,
    documentId: string,
    payload: { data: T; timestamp: number }
  ): Promise<void> {
    const arr = payload.data as unknown as any[];
    const total = arr.length;
    const batchCount = Math.ceil(total / this.BATCH_SIZE);

    console.log(`📌 [Firestore] Сохраняем '${collectionName}/${documentId}' батчами (${this.BATCH_SIZE} эл.): всего ${batchCount} частей.`);

    const parentRef = doc(this.firestore, collectionName, documentId);
    const chunksRef = collection(parentRef, 'chunks');

    // (При желании можно удалить старые чанки перед сохранением)
    // ...

    for (let i = 0; i < batchCount; i++) {
      const slice = arr.slice(i * this.BATCH_SIZE, (i + 1) * this.BATCH_SIZE);
      const batchRef = doc(chunksRef, `batch_${i}`);
      await setDoc(batchRef, {data: sanitize(slice), timestamp: payload.timestamp});
      console.log(`✅ Чанк ${i + 1}/${batchCount} записан (${slice.length} эл.)`);
    }
  }

  /**
   * Приватный метод — загрузка массива чанками
   */
  private async loadLargeArray<T>(collectionName: string, documentId: string): Promise<{ data: T; timestamp: number } | null> {
    try {
      const parentRef = doc(this.firestore, collectionName, documentId);
      const chunksRef = collection(parentRef, 'chunks');
      const snap = await getDocs(chunksRef);

      if (snap.empty) {
        console.warn(`⚠ [Firestore] Нет чанков у '${collectionName}/${documentId}'`);
        return null;
      }

      let combinedArray: any[] = [];
      let overallTimestamp: number | null = null;

      snap.forEach(docSnap => {
        const chunkData = docSnap.data()['data'] as any[];
        if (Array.isArray(chunkData)) {
          combinedArray = combinedArray.concat(chunkData);
        }
        if (overallTimestamp == null) {
          overallTimestamp = docSnap.data()['timestamp'] || null;
        }
      });

      if (overallTimestamp == null) {
        overallTimestamp = Date.now();
      }

      console.log(`✅ [Firestore] Чанки '${collectionName}/${documentId}' собраны (${combinedArray.length} эл.)`);
      return {data: combinedArray as unknown as T, timestamp: overallTimestamp};
    } catch (error: any) {
      console.error(`❌ [Firestore] Ошибка загрузки чанков '${collectionName}/${documentId}':`, error.message);
      return null;
    }
  }
}

/**
 * Рекурсивно приводим data в JSON-вид
 * (убираем undefined, Date -> string и т.п.)
 */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

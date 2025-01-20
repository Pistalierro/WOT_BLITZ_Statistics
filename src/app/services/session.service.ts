import {Injectable, signal} from '@angular/core';
import {collection, doc, Firestore, serverTimestamp, setDoc, updateDoc} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private currentSessionId = signal<string | null>(null); // ID текущей сессии
  private sessionData = signal<any | null>(null); // Данные текущей сессии

  constructor(private firestore: Firestore) {
  }

  getSessionId() {
    return this.currentSessionId;
  }

  getSessionData() {
    return this.sessionData;
  }

  async startSession(userId: string, startStats: any): Promise<string> {
    const sessionRef = doc(collection(this.firestore, 'sessions'));
    const sessionId = sessionRef.id;

    const sanitizedStats = this.sanitizeData(startStats);

    await setDoc(sessionRef, {
      userId,
      startTimestamp: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      startStats: sanitizedStats,
      currentStats: sanitizedStats,
      isActive: true,
    });

    this.currentSessionId.set(sessionId);
    this.sessionData.set({
      userId,
      startTimestamp: new Date(),
      currentStats: sanitizedStats,
      isActive: true,
    });

    return sessionId;
  }

  async updateSession(updatedStats: any): Promise<void> {
    const sessionId = this.currentSessionId();

    if (!sessionId) {
      throw new Error('Сессия не начата!');
    }

    const sessionRef = doc(this.firestore, `sessions/${sessionId}`);

    const sanitizedStats = this.sanitizeData(updatedStats);

    await updateDoc(sessionRef, {
      currentStats: sanitizedStats,
      lastUpdated: serverTimestamp(),
    });

    const currentData = this.sessionData();
    this.sessionData.set({
      ...currentData,
      currentStats: sanitizedStats,
      lastUpdated: new Date(),
    });
  }

  private sanitizeData(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (key, value) => (value === undefined ? null : value))
    );
  }
}

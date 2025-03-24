import {inject, Injectable} from '@angular/core';
import {doc, Firestore, increment, serverTimestamp, setDoc, updateDoc} from '@angular/fire/firestore';

@Injectable({providedIn: 'root'})
export class VisitTrackerService {
  private firestore = inject(Firestore);

  async logVisit(): Promise<void> {
    const ref = doc(this.firestore, 'stats/visits');
    try {
      await updateDoc(ref, {
        count: increment(1),
        lastVisit: serverTimestamp()
      });
    } catch (err) {
      await setDoc(ref, {
        count: 1,
        lastVisit: serverTimestamp()
      });
    }
  }
}

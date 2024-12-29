import {computed, Injectable, signal} from '@angular/core';
import {Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User} from '@angular/fire/auth';
import {doc, Firestore, getDoc, setDoc} from '@angular/fire/firestore';

@Injectable({providedIn: 'root'})
export class AuthService {
  private _currentUser = signal<User | null>(null);
  currentUser = computed(() => this._currentUser());
  private _wgPlayerId = signal<string | null>(null);
  wgPlayerId = computed(() => this._wgPlayerId());

  constructor(private auth: Auth, private firestore: Firestore) {
    this.auth.onAuthStateChanged((user) => {
      this._currentUser.set(user); // Обновляем сигнал
      if (user) this.loadUserData(user.uid); // Загружаем WG Player ID
    });
  }

  async register(email: string, password: string, wgPlayerId: string) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = userCredential.user.uid;

    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {email, wgPlayerId});

    this._currentUser.set(userCredential.user);
    this._wgPlayerId.set(wgPlayerId);
  }

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    this._currentUser.set(userCredential.user);
    this.loadUserData(userCredential.user.uid);
  }

  async logout() {
    await signOut(this.auth);
    this._currentUser.set(null);
    this._wgPlayerId.set(null);
  }

  private async loadUserData(uid: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      this._wgPlayerId.set(data['wgPlayerId'] || null);
    }
  }
}

import {inject, Injectable, signal} from '@angular/core';
import {Auth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, User} from '@angular/fire/auth';
import {doc, Firestore, getDoc, setDoc} from '@angular/fire/firestore';
import {PlayerStoreService} from './player-store.service';
import {Router} from '@angular/router';

@Injectable({providedIn: 'root'})
export class AuthService {

  userSignal = signal<User | null>(null);
  nicknameSignal = signal<string | null>(null);
  errorSignal = signal<string | null>(null);
  isAuthLoaded = signal(false);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private playerStore = inject(PlayerStoreService);
  private router = inject(Router);

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this.userSignal.set(user);
      this.isAuthLoaded.set(true);
      // console.log('🔥 Firebase прислал нового пользователя:', user);
      if (user) {
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const nickname = data['nickname'] || null;
          this.nicknameSignal.set(nickname);
          this.playerStore.nickname.set(nickname);

          if (nickname) {
            await this.playerStore.loadPlayerData(nickname);
          }
        }
      } else {
        this.nicknameSignal.set(null);
        this.playerStore.nickname.set(null);
        this.playerStore.accountId.set(null);
        this.playerStore.playerData.set(null);
      }
    });
  }

  isLoggedIn(): boolean {
    return !!this.userSignal();
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.userSignal.set(userCredential.user);
      this.errorSignal.set(null);
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error.code);
      this.errorSignal.set(errorMessage);
      console.log('Ошибка входа', errorMessage);
      throw error;
    }
  }

  async register(email: string, password: string, nickname: string) {
    try {
      // Регистрация пользователя в Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const {uid} = userCredential.user;

      // Создание документа в коллекции users
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userDocRef, {email, nickname, uid});

      console.log('Пользователь успешно зарегистрирован и добавлен в Firestore:', {email, nickname, uid});
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      throw error; // Пробрасываем ошибку для обработки в компоненте
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.userSignal.set(null); // Сбрасываем состояние
      this.router.navigate(['/home']);
      console.log('Вы вышли из системы');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  }

  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'Пользователь не найден.',
      'auth/wrong-password': 'Неверный пароль.',
      'auth/invalid-email': 'Некорректный формат email.',
      'auth/user-disabled': 'Учетная запись отключена.',
      'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
    };
    return errorMessages[errorCode] || 'Произошла неизвестная ошибка. Попробуйте снова.';
  }
}

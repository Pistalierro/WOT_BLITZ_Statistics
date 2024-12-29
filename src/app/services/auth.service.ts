import {inject, Injectable, signal} from '@angular/core';
import {Auth, signInWithEmailAndPassword} from '@angular/fire/auth';

@Injectable({providedIn: 'root'})
export class AuthService {

  userSignal = signal<any>(null);
  errorSignal = signal<string | null>(null);
  private auth = inject(Auth);

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.userSignal.set(userCredential);
      this.errorSignal.set(null);
      console.log('Вы вошли', userCredential.user);
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error.code);
      this.errorSignal.set(errorMessage);
      console.log('Ошибка входа', errorMessage);
      throw error;
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

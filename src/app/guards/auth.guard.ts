import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {MatDialog} from '@angular/material/dialog';
import {AuthComponent} from '../components/features/auth/auth.component';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  console.log('👀 Проверяем статус авторизации...');

  // 🔥 Ждём, пока Firebase загрузит данные (максимум 3 секунды)
  if (!authService.isAuthLoaded()) {
    let attempts = 0;
    while (!authService.isAuthLoaded() && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 🔄 Ждём 100 мс
      attempts++;
    }
  }

  console.log('✅ Firebase загрузился. user:', authService.userSignal());

  // 1️⃣ Если пользователь уже авторизован → пропускаем маршрут
  if (authService.isLoggedIn()) {
    return true;
  }

  // 2️⃣ Если мы сюда дошли → пользователя нет, показываем диалог
  console.log('⛔ Пользователь не авторизован, открываем диалог входа');

  const isMobile = window.innerWidth <= 600;
  const containerWidth = document.querySelector('.container')?.clientWidth || window.innerWidth;

  const dialogRef = dialog.open(AuthComponent, {
    width: isMobile ? `${containerWidth}px` : '40%',
    height: 'auto',
    maxWidth: isMobile ? 'none' : '500px',
    panelClass: isMobile ? 'full-screen-dialog' : '',
    disableClose: false,
    backdropClass: 'custom-backdrop',
  });

  // 3️⃣ Ждём закрытия диалога
  return dialogRef.afterClosed().toPromise().then(() => {
    if (authService.isLoggedIn()) {
      router.navigateByUrl(state.url);
      return true; // ✅ Пользователь вошёл → пропускаем маршрут
    } else {
      router.navigate(['/home']); // ❌ Пользователь не вошёл → редиректим
      return false;
    }
  });
};

import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {MatDialog} from '@angular/material/dialog';
import {AuthComponent} from '../components/features/auth/auth.component';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  if (authService.userSignal()) {
    return true;
  }

  const isMobile = window.innerWidth <= 600; // Мобильное устройство
  const containerWidth = document.querySelector('.container')?.clientWidth || window.innerWidth;
  const appRoot = document.querySelector('app-root');

  if (appRoot) {
    appRoot.setAttribute('inert', 'true'); // ❗ Блокируем фон
  }

  const dialogRef = dialog.open(AuthComponent, {
    width: isMobile ? `${containerWidth}px` : '40%',
    height: 'auto',
    maxWidth: isMobile ? 'none' : '500px',
    panelClass: isMobile ? 'full-screen-dialog' : '',
    disableClose: false,
    backdropClass: 'custom-backdrop',
  });

  dialogRef.afterClosed().subscribe(() => {
    if (authService.userSignal()) {
      router.navigateByUrl(state.url).then();
    } else router.navigate(['/home']).then();

    if (appRoot) {
      appRoot.removeAttribute('inert'); // ❗ Разблокируем фон после закрытия
    }
  });
  return false;
};

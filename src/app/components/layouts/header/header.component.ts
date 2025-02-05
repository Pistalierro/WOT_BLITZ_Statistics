import {Component, inject, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenav} from '@angular/material/sidenav';
import {NgIf} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {AuthComponent} from '../../features/auth/auth.component';
import {AuthService} from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterLink, RouterOutlet, NgIf, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly dialog = inject(MatDialog);
  readonly authService = inject(AuthService);
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isSidenavOpen: boolean = false;
  user$ = this.authService.userSignal;
  nickname$ = this.authService.nicknameSignal;

  toggleSidenav(): void {
    this.sidenav.toggle();
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  closeSidenav(): void {
    this.sidenav.close();
    this.isSidenavOpen = false;
  }

  onSidenavClose(): void {
    console.log('Сайд-меню закрыто');
  }

  openDialog() {
    const isMobile = window.innerWidth <= 600;
    const containerWidth = document.querySelector('.container')?.clientWidth || window.innerWidth;
    const appRoot = document.querySelector('app-root');

    if (appRoot) {
      appRoot.setAttribute('inert', 'true'); // ❗ Блокируем фон
    }

    const dialogRef = this.dialog.open(AuthComponent, {
      width: isMobile ? `${containerWidth}px` : '40%',
      height: 'auto',
      maxWidth: isMobile ? 'none' : '500px',
      panelClass: isMobile ? 'full-screen-dialog' : '',
      disableClose: false,
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe(() => {
      if (appRoot) {
        appRoot.removeAttribute('inert'); // ❗ Разблокируем фон после закрытия
      }
    });
  }

  logout(): void {
    this.authService.logout().then();
  }
}

import {Component, inject, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenav} from '@angular/material/sidenav';
import {NgIf} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {AuthComponent} from '../../features/auth/auth.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterLink, RouterOutlet, NgIf, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly dialog = inject(MatDialog);
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isSidenavOpen: boolean = false;

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
    const dialogRef = this.dialog.open(AuthComponent, {
      width: '30%',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}

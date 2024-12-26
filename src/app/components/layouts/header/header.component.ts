import {Component, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenav} from '@angular/material/sidenav';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterLink, RouterOutlet, NgIf, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
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
}

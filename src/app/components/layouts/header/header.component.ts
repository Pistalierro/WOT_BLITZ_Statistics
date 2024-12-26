import {Component, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterLink, RouterOutlet],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  closeSidenav(): void {
    this.sidenav.close();
  }

  onSidenavClose(): void {
    console.log('Сайд-меню закрыто');
  }
}

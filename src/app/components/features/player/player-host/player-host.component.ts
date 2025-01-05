import {Component, inject} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {MATERIAL_MODULES} from '../../../../mock/material-providers';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-player-host',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './player-host.component.html',
  styleUrl: './player-host.component.scss'
})
export class PlayerHostComponent {
  protected authService = inject(AuthService);
}

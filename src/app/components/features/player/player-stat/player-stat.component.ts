import {Component, inject} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';
import {PlayerStoreService} from '../../../../services/player-store.service';
import {MATERIAL_MODULES} from '../../../../mock/material-providers';

@Component({
  selector: 'app-player-stat',
  standalone: true,
  templateUrl: './player-stat.component.html',
  imports: [
    DatePipe,
    DecimalPipe,
    NgIf,
    ...MATERIAL_MODULES
  ],
  styleUrls: ['./player-stat.component.scss']
})
export class PlayerStatComponent {
  protected authService = inject(AuthService);
  protected playerStore = inject(PlayerStoreService);
}

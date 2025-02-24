import {Component, inject} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {DatePipe, DecimalPipe, NgClass, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {PlayerStoreService} from '../../../../services/player/player-store.service';
import {ANIMATIONS} from '../../../../shared/helpers/animations';
import {UtilsService} from '../../../../shared/utils.service';

@Component({
  selector: 'app-player-stat',
  standalone: true,
  templateUrl: './player-stat.component.html',
  imports: [
    DatePipe,
    DecimalPipe,
    NgIf,
    ...MATERIAL_MODULES,
    NgClass
  ],
  styleUrls: ['./player-stat.component.scss'],
  animations: [ANIMATIONS.fadeIn, ANIMATIONS.slideIn]
})
export class PlayerStatComponent {
  utilsService = inject(UtilsService);
  protected authService = inject(AuthService);
  protected playerStore = inject(PlayerStoreService);
}

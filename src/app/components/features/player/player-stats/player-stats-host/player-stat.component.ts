import {Component, inject} from '@angular/core';
import {DatePipe, DecimalPipe, NgClass, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {ANIMATIONS} from '../../../../../shared/helpers/animations';
import {UtilsService} from '../../../../../shared/utils.service';
import {TanksService} from '../../../../../services/tanks.service';
import {AuthService} from '../../../../../services/auth.service';
import {PlayerStoreService} from '../../../../../services/player/player-store.service';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';


@Component({
  selector: 'app-player-stats-host',
  standalone: true,
  templateUrl: './player-stat.component.html',
  imports: [
    DatePipe,
    DecimalPipe,
    NgIf,
    ...MATERIAL_MODULES,
    NgClass,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  styleUrls: ['./player-stat.component.scss'],
  animations: [ANIMATIONS.fadeIn, ANIMATIONS.slideIn]
})
export class PlayerStatComponent {
  utilsService = inject(UtilsService);
  tanksService = inject(TanksService);
  // Теперь все данные приходят напрямую из сервиса, без ручного вызова методов
  battlesByTier = this.tanksService.battlesByTier;
  battlesByType = this.tanksService.battlesByType;
  totalBattles = this.tanksService.totalBattles;
  protected authService = inject(AuthService);
  protected playerStore = inject(PlayerStoreService);
}

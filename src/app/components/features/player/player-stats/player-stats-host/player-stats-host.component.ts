import {Component, inject} from '@angular/core';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {ANIMATIONS} from '../../../../../shared/helpers/animations';
import {UtilsService} from '../../../../../shared/utils.service';
import {TanksService} from '../../../../../services/tanks.service';
import {AuthService} from '../../../../../services/auth.service';
import {PlayerStoreService} from '../../../../../services/player/player-store.service';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {OdometerDirective} from '../../../../../shared/directives/odometer.directive';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-player-stats-host',
  standalone: true,
  templateUrl: './player-stats-host.component.html',
  imports: [
    DatePipe,
    NgIf,
    ...MATERIAL_MODULES,
    NgClass,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    OdometerDirective,
    TranslatePipe
  ],
  styleUrls: ['./player-stats-host.component.scss'],
  animations: [ANIMATIONS.fadeIn, ANIMATIONS.slideIn]
})
export class PlayerStatsHostComponent {
  utilsService = inject(UtilsService);
  tanksService = inject(TanksService);
  // Теперь все данные приходят напрямую из сервиса, без ручного вызова методов
  battlesByTier = this.tanksService.battlesByTier;
  battlesByType = this.tanksService.battlesByType;
  totalBattles = this.tanksService.totalBattles;
  protected authService = inject(AuthService);
  protected playerStore = inject(PlayerStoreService);
}

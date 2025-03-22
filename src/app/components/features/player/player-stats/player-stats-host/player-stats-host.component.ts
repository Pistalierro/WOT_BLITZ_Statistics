import {Component, effect, inject} from '@angular/core';
import {DatePipe, DecimalPipe, NgClass, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {ANIMATIONS} from '../../../../../shared/helpers/animations';
import {UtilsService} from '../../../../../shared/utils.service';
import {TanksService} from '../../../../../services/tanks/tanks.service';
import {AuthService} from '../../../../../services/auth.service';
import {PlayerStoreService} from '../../../../../services/player/player-store.service';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {OdometerDirective} from '../../../../../shared/directives/odometer.directive';
import {TranslatePipe} from '@ngx-translate/core';
import {WN8Service} from '../../../../../services/wn8.service';

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
    TranslatePipe,
    DecimalPipe
  ],
  styleUrls: ['./player-stats-host.component.scss'],
  animations: [ANIMATIONS.fadeIn, ANIMATIONS.slideIn]
})
export class PlayerStatsHostComponent {
  utilsService = inject(UtilsService);
  tanksService = inject(TanksService);
  protected authService = inject(AuthService);
  protected playerStore = inject(PlayerStoreService);
  private wn8Service = inject(WN8Service);

  constructor() {
    effect(() => {
      const playerData = this.playerStore.playerDataSignal();
      const tanksList = this.tanksService.tanksList();
      const isWn8Ready = !this.wn8Service.loading();

      if (playerData && tanksList.length && isWn8Ready) {
        const wn8 = this.wn8Service.calculateWn8ForAccount(tanksList);
        const alreadySet = playerData.statistics?.all?.wn8 === wn8;
        if (!alreadySet) {
          const updatedPlayerData = {
            ...playerData,
            statistics: {
              ...playerData.statistics,
              all: {
                ...playerData.statistics.all,
                wn8
              }
            }
          };
          this.playerStore.playerDataSignal.set(updatedPlayerData);
        }
      }
    }, {allowSignalWrites: true});
  }

}

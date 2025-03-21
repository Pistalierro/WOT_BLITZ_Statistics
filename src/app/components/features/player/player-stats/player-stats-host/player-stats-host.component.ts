import {Component, inject, OnInit} from '@angular/core';
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
export class PlayerStatsHostComponent implements OnInit {
  utilsService = inject(UtilsService);
  tanksService = inject(TanksService);
  protected authService = inject(AuthService);
  protected playerStore = inject(PlayerStoreService);
  private wn8Service = inject(WN8Service);

  ngOnInit() {
    
  }
}

import {Component, effect, inject, OnInit} from '@angular/core';
import {TanksService} from '../../../../../services/tanks/tanks.service';
import {UtilsService} from '../../../../../shared/utils.service';
import {toRoman} from '../../../../../shared/helpers/tank-utils';
import {NgForOf, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {OdometerDirective} from '../../../../../shared/directives/odometer.directive';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-player-stats-by-damage',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ...MATERIAL_MODULES,
    OdometerDirective,
    TranslatePipe
  ],
  templateUrl: './player-stats-by-damage.component.html',
  styleUrl: './player-stats-by-damage.component.scss'
})
export class PlayerStatsByDamageComponent implements OnInit {

  statsDamagePercent: Record<number, number> = {};
  tanksService = inject(TanksService);
  protected readonly toRoman = toRoman;
  private utilsService = inject(UtilsService);

  constructor() {
    effect(() => {
      const avgDamageMap = this.tanksService.avgDamageByTier();
      if (Object.keys(avgDamageMap).length > 0) {
        this.statsDamagePercent = this.utilsService.initTierPercentMap([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

        setTimeout(() => {
          this.statsDamagePercent = this.utilsService.calculateScaledPercentages(avgDamageMap, 100);
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.statsDamagePercent = this.utilsService.initTierPercentMap([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  }
}

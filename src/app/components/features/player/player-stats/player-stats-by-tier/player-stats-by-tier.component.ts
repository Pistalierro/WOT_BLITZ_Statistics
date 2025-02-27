import {Component, effect, inject, OnInit} from '@angular/core';
import {TanksService} from '../../../../../services/tanks.service';
import {NgForOf, NgIf} from '@angular/common';
import {toRoman} from '../../../../../shared/helpers/tank-utils';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {UtilsService} from '../../../../../shared/utils.service';

@Component({
  selector: 'app-player-stats-by-tier',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ...MATERIAL_MODULES
  ],
  templateUrl: './player-stats-by-tier.component.html',
  styleUrls: ['./player-stats-by-tier.component.scss']
})
export class PlayerStatsByTierComponent implements OnInit {

  statsTierPercent: { [tier: number]: number } = {};
  tanksService = inject(TanksService);
  protected readonly toRoman = toRoman;
  private utilsService = inject(UtilsService);

  constructor() {
    effect(() => {
      const battlesMap = this.tanksService.battlesByTier();
      if (Object.keys(battlesMap).length > 0) {
        this.statsTierPercent = this.utilsService.initTierPercentMap([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
        setTimeout(() => {
          this.statsTierPercent = this.utilsService.calculateScaledPercentages(battlesMap, 95);
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.statsTierPercent = this.utilsService.initTierPercentMap([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  }
}

import {Component, effect, inject, OnInit} from '@angular/core';
import {TanksService} from '../../../../../services/tanks.service';
import {UtilsService} from '../../../../../shared/utils.service';
import {toRoman} from '../../../../../shared/helpers/tank-utils';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';

@Component({
  selector: 'app-player-stats-by-win-rate',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ...MATERIAL_MODULES,
    DecimalPipe
  ],
  templateUrl: './player-stats-by-win-rate.component.html',
  styleUrl: './player-stats-by-win-rate.component.scss'
})
export class PlayerStatsByWinRateComponent implements OnInit {

  statsWinRatePercent: Record<number, number> = {};
  tanksService = inject(TanksService);
  protected readonly toRoman = toRoman;
  private utilsService = inject(UtilsService);

  constructor() {
    effect(() => {
      const winRateMap = this.tanksService.winRateByTier();
      if (Object.keys(winRateMap).length > 0) {
        this.statsWinRatePercent = this.utilsService.initTierPercentMap([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
        setTimeout(() => {
          this.statsWinRatePercent = this.utilsService.calculateScaledPercentages(winRateMap, 95);
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.statsWinRatePercent = this.utilsService.initTierPercentMap([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  }
}

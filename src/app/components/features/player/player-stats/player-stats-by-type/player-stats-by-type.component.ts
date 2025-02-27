import {Component, effect, inject, OnInit} from '@angular/core';
import {TanksService} from '../../../../../services/tanks.service';
import {UtilsService} from '../../../../../shared/utils.service';
import {NgForOf, NgIf} from '@angular/common';
import {tankTypes} from '../../../../../shared/helpers/tank-utils';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';

@Component({
  selector: 'app-player-stats-by-type',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ...MATERIAL_MODULES
  ],
  templateUrl: './player-stats-by-type.component.html',
  styleUrl: './player-stats-by-type.component.scss'
})
export class PlayerStatsByTypeComponent implements OnInit {

  statsTypePercent: { [key: string]: number } = {};
  tanksService = inject(TanksService);
  protected readonly tankTypes = tankTypes;
  private utilsService = inject(UtilsService);

  constructor() {
    effect(() => {
      const battlesMap = this.tanksService.battlesByType();
      if (Object.keys(battlesMap).length > 0) {
        this.statsTypePercent = this.utilsService.initTierPercentMap(['lightTank', 'mediumTank', 'heavyTank', 'AT-SPG']);

        setTimeout(() => {
          this.statsTypePercent = this.utilsService.calculateScaledPercentages(battlesMap, 95);
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.statsTypePercent = this.utilsService.initTierPercentMap(['lightTank', 'mediumTank', 'heavyTank', 'AT-SPG']);
  }
}

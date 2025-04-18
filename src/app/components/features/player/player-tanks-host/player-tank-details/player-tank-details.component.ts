import {Component, computed, inject, OnInit} from '@angular/core';
import {DecimalPipe, NgClass, NgForOf, NgIf, NgStyle} from '@angular/common';
import {TanksService} from '../../../../../services/tanks/tanks.service';
import {ActivatedRoute} from '@angular/router';
import {TankProfile} from '../../../../../models/tank/tank-full-info.model';
import {UtilsService} from '../../../../../shared/utils.service';
import {getFlagUrl, getShellType, tankTypes, toRoman} from '../../../../../shared/helpers/tank-utils';
import {user} from '@angular/fire/auth';
import {TanksDataService} from '../../../../../services/tanks/tanks-data.service';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {TranslatePipe} from '@ngx-translate/core';
import {calculateAverageStats, calculateGeneralStats} from '../../../../../mock/tank-utils';

@Component({
  selector: 'app-player-tank-details',
  standalone: true,
  imports: [
    DecimalPipe,
    ...MATERIAL_MODULES,
    NgStyle,
    NgIf,
    NgForOf,
    TranslatePipe,
    NgClass
  ],
  templateUrl: './player-tank-details.component.html',
  styleUrl: './player-tank-details.component.scss'
})
export class PlayerTankDetailsComponent implements OnInit {
  statsPercent: Record<string, number> = {};
  tank!: TankProfile;
  tanksService = inject(TanksService);
  selectedTank = this.tanksService.selectedTankData;
  tanksDataService = inject(TanksDataService);
  utilsService = inject(UtilsService);

  generalStats = computed(() => {
    const tank = this.selectedTank();
    if (!tank) return [];
    return calculateGeneralStats(tank);
  });

  averageStats = computed(() => {
    const tank = this.selectedTank();
    if (!tank) return [];

    return calculateAverageStats(tank);
  });
  
  protected readonly toRoman = toRoman;
  protected readonly tankTypes = tankTypes;
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly getShellType = getShellType;
  protected readonly user = user;
  private activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.activatedRoute.data.subscribe(({tank}) => {
      this.tank = tank;
    });

    this.tanksDataService.loadMaxValues().subscribe(() => {
      setTimeout(() => {
        this.statsPercent = {
          hp: this.tanksDataService.getStatPercentage('hp', this.tank.hp),
          damage: this.tanksDataService.getStatPercentage('damage', this.tank.shells[0].damage || 0),
          fire_rate: this.tanksDataService.getStatPercentage('fire_rate', this.tank.gun.fire_rate),
          penetration: this.tanksDataService.getStatPercentage('penetration', this.tank.shells[0].penetration || 0),
          speed: this.tanksDataService.getStatPercentage('speed', this.tank.speed_forward),
          traverse: this.tanksDataService.getStatPercentage('traverse', this.tank.suspension.traverse_speed),
        };
      }, 100);
    });
  }
}

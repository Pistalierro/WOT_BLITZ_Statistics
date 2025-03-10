import {Component, inject, OnInit} from '@angular/core';
import {NgForOf, NgIf, NgStyle} from '@angular/common';
import {TanksService} from '../../../../../services/tanks/tanks.service';
import {ActivatedRoute} from '@angular/router';
import {TankProfile} from '../../../../../models/tank/tank-full-info.model';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {UtilsService} from '../../../../../shared/utils.service';
import {getFlagUrl, getShellType, tankTypes, toRoman} from '../../../../../shared/helpers/tank-utils';

@Component({
  selector: 'app-player-tank-details',
  standalone: true,
  imports: [
    NgIf,
    ...MATERIAL_MODULES,
    NgStyle,
    NgForOf
  ],
  templateUrl: './player-tank-details.component.html',
  styleUrl: './player-tank-details.component.scss'
})
export class PlayerTankDetailsComponent implements OnInit {

  tank!: TankProfile;
  tanksService = inject(TanksService);
  utilsService = inject(UtilsService);
  protected readonly toRoman = toRoman;
  protected readonly tankTypes = tankTypes;
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly getShellType = getShellType;
  private activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.activatedRoute.data.subscribe(({tank}) => {
      console.log('Загруженный танк:', tank);
      this.tank = tank;
    });
    console.log('🚀 Загруженный танк:', this.tank);
    console.log('📌 Снаряды:', this.tank?.shells);
  }
}

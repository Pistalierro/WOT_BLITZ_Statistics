import {Component, inject} from '@angular/core';
import {TanksService} from '../../../../services/tanks.service';
import {DecimalPipe, NgForOf, NgIf, SlicePipe} from '@angular/common';
import {PlayerStoreService} from '../../../../services/player-store.service';
import {getFlagUrl} from '../../../../mock/tank-utils';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    DecimalPipe,
    SlicePipe,
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent {
  protected tanksService = inject(TanksService);
  protected readonly getFlagUrl = getFlagUrl;
  private playerStore = inject(PlayerStoreService);
}

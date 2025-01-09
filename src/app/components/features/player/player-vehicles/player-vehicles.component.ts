import {Component, inject} from '@angular/core';
import {TanksService} from '../../../../services/tanks.service';
import {NgForOf, NgIf} from '@angular/common';
import {PlayerStoreService} from '../../../../services/player-store.service';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent {
  protected tanksService = inject(TanksService);
  private playerStore = inject(PlayerStoreService);
}

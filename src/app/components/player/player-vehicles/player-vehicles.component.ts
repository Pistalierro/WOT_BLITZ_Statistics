import {Component, effect, inject} from '@angular/core';
import {PlayerService} from '../../../services/player.service';
import {VehicleService} from '../../../services/vehicle.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent {


  private playerService = inject(PlayerService);
  private vehicleService = inject(VehicleService);
  vehicles = this.vehicleService.vehiclesSignal;

  constructor() {
    effect(() => {
      const accountId = this.playerService.playerId();
      if (accountId) {
        this.vehicleService.getVehicles(accountId);
      }
    });
  }
}

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
  vehicles = this.vehicleService.tanksSignal;
  tanksDetails = this.vehicleService.tanksDetailsSignal;

  constructor() {
    effect(() => {
      const accountId = this.playerService.playerId();
      if (accountId) {
        this.vehicleService.getPlayerTanksList(accountId);
      }
    });
  }

  getWinRate(vehicle: any): number {
    const battles = vehicle.all?.battles ?? 0;
    const wins = vehicle.all?.wins ?? 0;
    if (battles === 0) {
      return 0;
    }
    return (wins / battles) * 100;
  }
}

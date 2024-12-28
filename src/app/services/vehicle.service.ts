import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {MergedTankInterface, TankDetailsResponseInterface, TankInterface, TanksResponseInterface} from '../models/vehicles-response.model';


@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  tanksSignal = signal<TankInterface[] | null>(null);
  tanksDetailsSignal = signal<MergedTankInterface[] | null>(null);
  private http = inject(HttpClient);

  getPlayerTanksList(accountId: number) {
    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&fields=tank_id%2C+all.battles%2C+all.damage_dealt%2C+all.wins&language=ru`;
    this.http.get<TanksResponseInterface>(url).subscribe({
      next: (res) => {
        const vehiclesData = res.data[accountId];
        if (vehiclesData && Array.isArray(vehiclesData)) {
          const filteredVehicles = vehiclesData.filter(vehicle => vehicle.all.battles > 0);
          this.tanksSignal.set(filteredVehicles);
          this.getTankDetails(filteredVehicles.map(v => v.tank_id));
        }
      }
    });
  }


  getTankDetails(tankIds: number[]) {
    const idsString = tankIds.join(',');
    const url = `${apiConfig.baseUrl}/encyclopedia/vehicles/?application_id=${apiConfig.applicationId}&fields=name,nation,is_premium&tank_id=${idsString}&language=ru`;

    this.http.get<TankDetailsResponseInterface>(url).subscribe({
      next: (res) => {
        const tankDetails = res.data;
        const tanks = this.tanksSignal();
        if (!tanks) return;

        const mergedTanks: MergedTankInterface[] = tanks.map(tank => ({...tank, ...tankDetails[tank.tank_id]}));
        this.tanksDetailsSignal.set(mergedTanks);
      },
      error: (err) => {
        console.error('Ошибка при запросе деталей танков:', err);
      },
    });
  }

}

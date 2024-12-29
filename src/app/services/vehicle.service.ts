import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';
import {MergedTankInterface, TankDetailsResponseInterface, TankInterface, TanksResponseInterface} from '../models/vehicles-response.model';


@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  loadingSignal = signal<boolean | null>(null);
  errorSignal = signal<string | null>(null);
  tanksSignal = signal<TankInterface[] | null>(null);
  tanksDetailsSignal = signal<MergedTankInterface[] | null>(null);
  private http = inject(HttpClient);

  getPlayerTanksList(accountId: number) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&fields=tank_id%2C+all.battles%2C+all.damage_dealt%2C+all.wins&language=ru`;
    this.http.get<TanksResponseInterface>(url).subscribe({
      next: (res) => {
        const vehiclesData = res.data[accountId];
        if (vehiclesData && Array.isArray(vehiclesData)) {
          const filteredVehicles = vehiclesData.filter(vehicle => vehicle.all.battles > 0);
          this.tanksSignal.set(filteredVehicles);
          this.getTankDetails(filteredVehicles.map(v => v.tank_id));
        }
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(`Ошибка при получении данных о танках игрока: ${err.message}`);
      }
    });
  }


  getTankDetails(tankIds: number[]) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const idsString = tankIds.join(',');
    const url = `${apiConfig.baseUrl}/encyclopedia/vehicles/?application_id=${apiConfig.applicationId}&fields=name,nation,is_premium&tank_id=${idsString}&language=ru`;

    this.http.get<TankDetailsResponseInterface>(url).subscribe({
      next: (res) => {
        const tankDetails = res.data;
        const tanks = this.tanksSignal();
        if (!tanks) return;

        const mergedTanks: MergedTankInterface[] = tanks.map(tank => ({...tank, ...tankDetails[tank.tank_id]}));
        this.tanksDetailsSignal.set(mergedTanks);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(`Ошибка при получении данных о танках игрока: ${err.message}`);
      },
    });
  }

}

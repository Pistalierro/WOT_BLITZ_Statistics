import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiConfig} from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  vehiclesSignal = signal<any>(null);
  tankIds = signal<any[]>([]);
  private http = inject(HttpClient);

  getVehicles(accountId: number): void {
    const url = `${apiConfig.baseUrl}/tanks/stats/?application_id=${apiConfig.applicationId}&account_id=${accountId}&language=ru`;

    this.http.get<any>(url).subscribe({
      next: res => {
        const data = res.data[accountId];
        if (data && Array.isArray(data)) {
          const filteredVehicles = data.filter(vehicle => vehicle.all.battles > 0);
          console.log('Отфильтрованные танки', filteredVehicles);
          filteredVehicles.forEach(vehicle => console.log(vehicle.tank_id));
          this.vehiclesSignal.set(filteredVehicles);
        } else {
          this.vehiclesSignal.set([]); // Если данных нет
        }
      },
      error: err => {
        console.error('Данные о технике не получены', err);
        this.vehiclesSignal.set([]); // На случай ошибки
      }
    });
  }
}

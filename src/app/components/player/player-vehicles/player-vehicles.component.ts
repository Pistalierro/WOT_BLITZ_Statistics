import {AfterViewInit, Component, effect, inject, ViewChild} from '@angular/core';
import {PlayerService} from '../../../services/player.service';
import {VehicleService} from '../../../services/vehicle.service';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {MergedTankInterface} from '../../../models/vehicles-response.model';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {DecimalPipe} from '@angular/common';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    DecimalPipe
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'nation', 'battles', 'wins', 'winRate', 'damageDeal'];
  dataSource!: MatTableDataSource<MergedTankInterface>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private playerService = inject(PlayerService);
  private vehicleService = inject(VehicleService);
  vehicles = this.vehicleService.tanksSignal;
  tanksDetails = this.vehicleService.tanksDetailsSignal;
  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.dataSource = new MatTableDataSource<MergedTankInterface>();

    effect(() => {
      const accountId = this.playerService.playerId();
      if (accountId) {
        this.vehicleService.getPlayerTanksList(accountId);
      }
    });

    effect(() => {
      const mergedData = this.tanksDetails();
      if (mergedData) this.dataSource.data = mergedData;
    });

    this.dataSource.sortingDataAccessor = (item: MergedTankInterface, property) => {
      const battles = item.all?.battles ?? 0;
      const damage = item.all?.damage_dealt ?? 0;
      const wins = item.all?.wins ?? 0;

      switch (property) {
        case 'battles':
          return item.all?.battles ?? 0;
        case 'wins':
          return item.all?.wins ?? 0;
        case 'winRate':
          return battles === 0 ? 0 : (wins / battles) * 100;
        case 'damageDeal':
          return battles === 0 ? 0 : damage / battles;
        default:
          return (item as any)[property];
      }
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getWinRate(vehicle: MergedTankInterface): number {
    const battles = vehicle.all?.battles ?? 0;
    const wins = vehicle.all?.wins ?? 0;
    if (battles === 0) return 0;
    return (wins / battles) * 100;
  }

  getDamageDeal(vehicle: MergedTankInterface) {
    const battles = vehicle.all?.battles ?? 0;
    const damage = vehicle.all?.damage_dealt ?? 0;
    if (battles === 0) return 0;
    return damage / battles;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

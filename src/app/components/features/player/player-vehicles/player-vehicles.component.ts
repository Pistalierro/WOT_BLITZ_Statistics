import {AfterViewInit, Component, effect, inject, ViewChild} from '@angular/core';
import {TanksService} from '../../../../services/tanks.service';
import {PlayerStoreService} from '../../../../services/player-store.service';
import {getFlagUrl, getVehicleTypeIconUrl} from '../../../../mock/tank-utils';
import {MATERIAL_MODULES} from '../../../../mock/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Tank} from '../../../../models/tanks-response.model';
import {DecimalPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    DecimalPipe,
    NgIf
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'nation', 'battles', 'tier', 'type', 'damage'];
  dataSource = new MatTableDataSource<Tank>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  protected tanksService = inject(TanksService);
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly getVehicleTypeIconUrl = getVehicleTypeIconUrl;
  private playerStore = inject(PlayerStoreService);

  constructor() {
    effect(() => {
      const tankList = this.tanksService.tanksList();
      if (tankList) {
        this.dataSource.data = tankList;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

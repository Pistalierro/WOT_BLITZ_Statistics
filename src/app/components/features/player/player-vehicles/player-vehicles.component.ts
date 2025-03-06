import {AfterViewInit, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {TanksService} from '../../../../services/tanks/tanks.service';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Tank} from '../../../../models/tank/tanks-response.model';
import {DecimalPipe, NgClass, NgIf, NgStyle} from '@angular/common';
import {COLUMNS_NAMES, getFlagUrl, tankTypes, toRoman} from '../../../../shared/helpers/tank-utils';
import {AuthService} from '../../../../services/auth.service';
import {sanitizeUrl} from '../../../../shared/helpers/utils';
import {TranslatePipe} from '@ngx-translate/core';
import {TanksDataService} from '../../../../services/tanks/tanks-data.service';
import {UtilsService} from '../../../../shared/utils.service';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    DecimalPipe,
    NgIf,
    NgStyle,
    TranslatePipe,
    NgClass
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = COLUMNS_NAMES;
  dataSource = new MatTableDataSource<Tank>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  utilsService = inject(UtilsService);
  protected tanksService = inject(TanksService);
  protected authService = inject(AuthService);
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly toRoman = toRoman;
  protected readonly tankTypes = tankTypes;
  protected readonly sanitizeUrl = sanitizeUrl;
  private tanksDataService = inject(TanksDataService);

  constructor() {
    effect(() => {
      const tankList = this.tanksService.tanksList();
      if (tankList) {
        this.dataSource.data = tankList;
      }
    });
  }

  ngOnInit() {
    // void this.tanksDataService.loadAndSaveTanks();
    // void this.tanksService.findMissingTanks();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.dataSource.sortingDataAccessor = (tank, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'nation':
          return tank.nation;
        case 'tier':
          return tank.tier;
        case 'name':
          return tank.name;
        case 'win_rate':
          return tank.all.battles ? (tank.all.wins / tank.all.battles) * 100 : 0;
        case 'battles':
          return tank.all.battles;
        case 'damage':
          return tank.all.battles ? tank.all.damage_dealt / tank.all.battles : 0;
        default:
          return (tank as any)[sortHeaderId];
      }
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

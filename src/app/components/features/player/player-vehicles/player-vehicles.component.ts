import {AfterViewInit, Component, effect, inject, ViewChild} from '@angular/core';
import {TanksService} from '../../../../services/tanks.service';
import {MATERIAL_MODULES} from '../../../../mock/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Tank} from '../../../../models/tanks-response.model';
import {DecimalPipe, NgIf, NgStyle} from '@angular/common';
import {COLUMNS_NAMES, getFlagUrl, tankTypes, toRoman} from '../../../../mock/tank-utils';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';

@Component({
  selector: 'app-player-vehicles',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    DecimalPipe,
    NgIf,
    NgStyle
  ],
  templateUrl: './player-vehicles.component.html',
  styleUrl: './player-vehicles.component.scss'
})
export class PlayerVehiclesComponent implements AfterViewInit {
  displayedColumns: string[] = COLUMNS_NAMES;
  dataSource = new MatTableDataSource<Tank>([]);
  isMobile = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  protected tanksService = inject(TanksService);
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly toRoman = toRoman;
  protected readonly tankTypes = tankTypes;
  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    effect(() => {
      const tankList = this.tanksService.tanksList();
      if (tankList) {
        this.dataSource.data = tankList;
      }
    });
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Кастомный метод извлечения «значения для сортировки»
    this.dataSource.sortingDataAccessor = (tank, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'nation':
          return tank.nation; // строка 'usa', 'germany', ...
        case 'tier':
          return tank.tier; // число 1..10
        case 'name':
          return tank.name; // строка
        // Если в displayedColumns у вас ещё есть 'win_rate', 'damage' и т.п.
        case 'win_rate':
          // Вычисляем процент
          return tank.all.battles
            ? (tank.all.wins / tank.all.battles) * 100
            : 0;
        case 'battles':
          return tank.all.battles;
        case 'damage':
          return tank.all.battles
            ? tank.all.damage_dealt / tank.all.battles
            : 0;
        default:
          // Фолбек на случай, если добавили новую колонку
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

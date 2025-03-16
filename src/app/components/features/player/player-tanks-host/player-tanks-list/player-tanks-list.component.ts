import {AfterViewInit, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {TanksService} from '../../../../../services/tanks/tanks.service';
import {MATERIAL_MODULES} from '../../../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Tank} from '../../../../../models/tank/tanks-response.model';
import {DatePipe, DecimalPipe, NgClass, NgIf, NgStyle} from '@angular/common';
import {getFlagUrl, tankTypes, toRoman} from '../../../../../shared/helpers/tank-utils';
import {AuthService} from '../../../../../services/auth.service';
import {sanitizeUrl} from '../../../../../shared/helpers/utils';
import {TranslatePipe} from '@ngx-translate/core';
import {UtilsService} from '../../../../../shared/utils.service';
import {Router} from '@angular/router';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';

@Component({
  selector: 'app-player-tanks-list',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    DecimalPipe,
    NgIf,
    NgStyle,
    TranslatePipe,
    NgClass,
    DatePipe
  ],
  templateUrl: './player-tanks-list.component.html',
  styleUrl: './player-tanks-list.component.scss'
})
export class PlayerTanksListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['mainInfo', 'battles', 'win_rate', 'accuracy', 'avgXp', 'lastBattle', 'avgDamage'];
  dataSource = new MatTableDataSource<Tank>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  utilsService = inject(UtilsService);
  hasMastery = false;
  protected tanksService = inject(TanksService);
  protected authService = inject(AuthService);
  protected readonly getFlagUrl = getFlagUrl;
  protected readonly toRoman = toRoman;
  protected readonly tankTypes = tankTypes;
  protected readonly sanitizeUrl = sanitizeUrl;
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const tankList = this.tanksService.tanksList();
      if (tankList.length) {
        this.dataSource.data = tankList.map(tank => ({
          ...tank,
          winRate: tank.all.battles ? ((tank.all.wins / tank.all.battles) * 100) : 0,
          accuracy: tank.all.shots ? ((tank.all.hits / tank.all.shots) * 100) : 0,
          avg_xp: (tank.all.xp / tank.all.battles),
          avg_damage: tank.all.battles ? (tank.all.damage_dealt / tank.all.battles) : 0,
        }));

        setTimeout(() => {
          if (this.sort) {
            this.dataSource.sort = this.sort;
            this.dataSource.sort.sortChange.emit();
          }
          if (this.paginator) this.dataSource.paginator = this.paginator;
        });
      }
    });
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall]) {
        this.displayedColumns = ['mainInfo', 'battles', 'win_rate', 'avgDamage'];
      } else if (result.breakpoints[Breakpoints.Small]) {
        this.displayedColumns = ['mainInfo', 'battles', 'win_rate', 'accuracy', 'avgDamage'];
      } else {
        this.displayedColumns = ['mainInfo', 'master', 'battles', 'win_rate', 'accuracy', 'lastBattle', 'avgXp', 'avgDamage'];
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (tank, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'battles':
          return Number(tank.all.battles);
        case 'win_rate':
          return Number(tank.winRate) || 0;
        case 'avgXp':
          return Number(tank.winRate) || 0;
        case 'avgDamage':
          return Number(tank.avg_damage) || 0;
        case 'lastBattle':
          return Number(tank.last_battle_time);
        default:
          return (tank as any)[sortHeaderId] || 0;
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

  navigateToTankDetails(tankId: number) {
    void this.router.navigate([`/tanks/${tankId}`]);
  }
}

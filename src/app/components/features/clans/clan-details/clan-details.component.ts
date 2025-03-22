import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {DatePipe, DecimalPipe, NgClass, NgIf} from '@angular/common';
import {ClanService} from '../../../../services/clan/clan.service';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {UtilsService} from '../../../../shared/utils.service';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {ANIMATIONS} from '../../../../shared/helpers/animations';
import {MatSort} from '@angular/material/sort';
import {PlayerStoreService} from '../../../../services/player/player-store.service';
import {TranslatePipe} from '@ngx-translate/core';
import {PlayerData} from '../../../../models/player/player-response.model';

@Component({
  selector: 'app-clan-details',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, DatePipe, NgClass, TranslatePipe],
  templateUrl: './clan-details.component.html',
  styleUrl: './clan-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [ANIMATIONS.fadeIn, ANIMATIONS.slideIn]
})
export class ClanDetailsComponent implements OnInit, AfterViewInit {
  clanService = inject(ClanService);
  utilsService = inject(UtilsService);
  router = inject(Router);
  dataSource = new MatTableDataSource<PlayerData>([]);
  displayedColumns = ['nickname', 'created_at', 'last_battle_time', 'battles', 'accuracy', 'avgDamage', 'winRate'];
  isMobile: boolean = false;
  @ViewChild(MatSort) sort!: MatSort;
  private breakpointObserver = inject(BreakpointObserver);
  private cdRef = inject(ChangeDetectorRef);
  private playerStore = inject(PlayerStoreService);

  constructor() {
    effect(() => {
      const playersList = this.clanService.clanPlayersList();
      if (playersList) {
        this.dataSource.data = playersList
          .filter(player => player !== null)
          .map(player => ({
            ...player,
            battles: player.statistics.all.battles,
            avgDamage: player.statistics.all.damage_dealt / player.statistics.all.battles,
            accuracy: (player.statistics.all.hits / player.statistics.all.shots) * 100,
            winRate: (player.statistics.all.wins / player.statistics.all.battles) * 100,
            wn8: player.statistics.all.wn8
          }));
      }
    });
  }

  get clanPlayersListArray() {
    return this.clanService.clanPlayersList() ?? [];
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium]).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall]) {
        this.displayedColumns = ['nickname', 'battles', 'avgDamage', 'winRate'];
        this.isMobile = true;
      } else if (result.breakpoints[Breakpoints.Small]) {
        this.displayedColumns = ['nickname', 'battles', 'accuracy', 'avgDamage', 'winRate'];
        this.isMobile = false;
      } else if (result.breakpoints[Breakpoints.Medium]) {
        this.displayedColumns = ['nickname', 'created_at', 'battles', 'accuracy', 'avgDamage', 'winRate'];
        this.isMobile = false;
      } else this.displayedColumns = ['nickname', 'created_at', 'last_battle_time', 'battles', 'accuracy', 'avgDamage', 'winRate'];
      this.cdRef.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  goBack(): void {
    void this.router.navigate(['/clans']);
  }

  onSelectPlayer(accountId: number) {
    if (!accountId) return;
    this.playerStore.accountIdSignal.set(accountId);
    this.playerStore.getPlayerDataById(accountId).then(() => {
      void this.router.navigate(['/players/stat']);
    });
  }
}

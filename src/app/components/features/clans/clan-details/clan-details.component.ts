import {ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {DatePipe, DecimalPipe, NgClass, NgIf} from '@angular/common';
import {ClanService} from '../../../../services/clan/clan.service';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {ExtendedClanDetails} from '../../../../models/clan/clan-response.model';
import {UtilsService} from '../../../../shared/utils.service';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-clan-details',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, DatePipe, NgClass],
  templateUrl: './clan-details.component.html',
  styleUrl: './clan-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanDetailsComponent implements OnInit {
  clanService = inject(ClanService);
  utilsService = inject(UtilsService);
  router = inject(Router);
  dataSource = new MatTableDataSource<ExtendedClanDetails>([]);
  displayedColumns = ['nickname', 'created_at', 'last_battle_time', 'battles', 'accuracy', 'avgDamage', 'winRate'];
  private breakpointObserver = inject(BreakpointObserver);
  private cdRef = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const playersList = this.clanService.clanPlayersList();
      if (playersList) {
        this.dataSource.data = playersList.filter(player => player !== null);
      }
    });
  }

  get clanPlayersListArray() {
    return this.clanService.clanPlayersList() ?? [];
  }

  ngOnInit() {
    this.breakpointObserver.observe([
      '(max-width: 1200px)',
      '(max-width: 768px)',
      '(max-width: 576px)',
    ]).subscribe(result => {
      if (result.breakpoints['(max-width: 576px)']) {
        this.displayedColumns = ['nickname', 'battles', 'avgDamage', 'winRate'];
      } else if (result.breakpoints['(max-width: 768px)']) {
        this.displayedColumns = ['nickname', 'battles', 'accuracy', 'avgDamage', 'winRate'];
      } else if (result.breakpoints['(max-width: 1200px)']) {
        this.displayedColumns = ['nickname', 'created_at', 'battles', 'accuracy', 'avgDamage', 'winRate'];
      } else {
        this.displayedColumns = ['nickname', 'created_at', 'last_battle_time', 'battles', 'accuracy', 'avgDamage', 'winRate'];
      }
      this.cdRef.detectChanges(); // Форсируем обновление
    });
  }

  goBack(): void {
    void this.router.navigate(['/clans']);
  }

}

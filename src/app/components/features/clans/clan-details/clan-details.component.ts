import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';
import {ClanService} from '../../../../services/clan/clan.service';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {ExtendedClanDetails} from '../../../../models/clan/clan-response.model';

@Component({
  selector: 'app-clan-details',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, DatePipe],
  templateUrl: './clan-details.component.html',
  styleUrl: './clan-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanDetailsComponent {
  clanService = inject(ClanService);
  router = inject(Router);
  dataSource = new MatTableDataSource<ExtendedClanDetails>([]);
  displayedColumns = ['nickname', 'battles', 'winRate', 'avgDamage'];

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

  goBack(): void {
    void this.router.navigate(['/clans']);
  }

}

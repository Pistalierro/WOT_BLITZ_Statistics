import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';
import {ClanService} from '../../../../services/clan/clan.service';
import {Router} from '@angular/router';

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

  goBack(): void {
    void this.router.navigate(['/clans']);
  }
}

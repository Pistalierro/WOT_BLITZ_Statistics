import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';
import {ClanService} from '../../../../services/clan/clan.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-clan-details',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe, DatePipe],
  templateUrl: './clan-details.component.html',
  styleUrl: './clan-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanDetailsComponent implements OnInit {
  clanService = inject(ClanService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  clanDetails = this.clanService.topClanDetails;


  ngOnInit() {
    const clanId = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    if (!isNaN(clanId)) void this.clanService.getClanDetailsById(clanId);
  }

  goBack(): void {
    this.router.navigate(['/clans']);
  }
}

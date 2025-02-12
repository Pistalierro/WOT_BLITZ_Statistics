import {Component, inject, OnInit} from '@angular/core';
import {ClanService} from '../../../services/clan/clan.service';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';

@Component({
  selector: 'app-clans',
  standalone: true,
  imports: [
    NgIf,
    ...MATERIAL_MODULES,
    NgForOf,
    DecimalPipe
  ],
  templateUrl: './clans.component.html',
  styleUrl: './clans.component.scss'
})
export class ClansComponent implements OnInit {
  clanService = inject(ClanService);

  ngOnInit() {
    this.clanService.getTopClanDetails();
  }

  async updateAllData(): Promise<void> {
    await this.clanService.getAllClansIds();
    await this.clanService.getBigClansIds();
    await this.clanService.getTopClansIds();
    await this.clanService.getTopClanDetails();
  }
}

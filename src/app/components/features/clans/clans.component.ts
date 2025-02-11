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
  allClanIds: number[] = [];
  largeClansIds: number[] = [];
  topClanIds: number[] = [];
  clanService = inject(ClanService);

  ngOnInit() {
    this.clanService.getTopClanDetails().then();
  }

  async updateAllData(): Promise<void> {
    await this.clanService.getAllClansIds().then();
    await this.clanService.getBigClansIds().then();
    await this.clanService.getTopClansIds().then();
    await this.clanService.getTopClanDetails().then();
  }
}

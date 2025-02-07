import {Component, inject, OnInit} from '@angular/core';
import {ClanService} from '../../../services/clan.service';
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
  topClanIds: number[] = [];
  clanService = inject(ClanService);

  ngOnInit() {
    this.clanService.getTopClanDetails();
  }


  async getAllClanIds(): Promise<void> {
    await this.clanService.getAllClanIds();
    this.allClanIds = [...this.clanService.allClanIds];
  }

  async getTopClanIds(): Promise<void> {
    await this.clanService.getTopClanIds();
    this.topClanIds = [...this.clanService.topClanIds];
  }

  async getTopClanDetails() {
    await this.clanService.getTopClanDetails();
  }

  private loadClanIds(): void {
    this.allClanIds = this.clanService.allClanIds;
    this.topClanIds = this.clanService.topClanIds;
  }
}

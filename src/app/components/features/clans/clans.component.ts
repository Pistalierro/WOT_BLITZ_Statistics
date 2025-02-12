import {AfterViewInit, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {ClanService} from '../../../services/clan/clan.service';
import {DecimalPipe, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {ExtendedClanDetails} from '../../../models/clan/clan-response.model';
import {MatPaginator} from '@angular/material/paginator';

@Component({
  selector: 'app-clans',
  standalone: true,
  imports: [
    NgIf,
    ...MATERIAL_MODULES,
    DecimalPipe
  ],
  templateUrl: './clans.component.html',
  styleUrl: './clans.component.scss'
})
export class ClansComponent implements OnInit, AfterViewInit {
  clanService = inject(ClanService);

  displayedColumns: string[] = ['index', 'name', 'tag', 'leader_name', 'membersCount', 'winRate'];
  dataSource = new MatTableDataSource<ExtendedClanDetails>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    effect(() => {
      const clanList = this.clanService.topClanDetails();
      if (clanList) this.dataSource.data = clanList;
    });
  }

  ngOnInit() {
    void this.clanService.getTopClanDetails();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async updateAllData(): Promise<void> {
    await this.clanService.getAllClansIds();
    await this.clanService.getBigClansIds();
    await this.clanService.getTopClansIds();
    await this.clanService.getTopClanDetails();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getRowIndex(index: number): number {
    return this.paginator ? index + 1 + this.paginator.pageIndex * this.paginator.pageSize : index + 1;
  }
}

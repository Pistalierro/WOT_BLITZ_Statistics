import {AfterViewInit, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {ClanService} from '../../../services/clan/clan.service';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {ExtendedClanDetails} from '../../../models/clan/clan-response.model';
import {MatPaginator} from '@angular/material/paginator';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-clans',
  standalone: true,
  imports: [
    NgIf,
    ...MATERIAL_MODULES,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './clan-list.component.html',
  styleUrl: './clan-list.component.scss'
})
export class ClanListComponent implements OnInit, AfterViewInit {
  clanService = inject(ClanService);
  displayedColumns: string[] = ['index', 'tag', 'name', 'leader_name', 'membersCount', 'created_at', 'winRate'];
  dataSource = new MatTableDataSource<ExtendedClanDetails>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    effect(() => {
      const clanList = this.clanService.topClanDetails();
      if (clanList) this.dataSource.data = clanList;
    });

    // this.breakpointObserver.observe([
    //   '(max-width: 992px)',
    //   '(max-width: 768px)',
    //   '(max-width: 576px)',
    // ]).subscribe(result => {
    //   if (result.breakpoints['(max-width: 576px)']) this.displayedColumns = ['index', 'tag', 'membersCount', 'winRate'];
    //   if (result.breakpoints['(max-width: 768px)']) this.displayedColumns = ['index', 'tag', 'name', 'membersCount', 'created_at', 'winRate'];
    // });
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

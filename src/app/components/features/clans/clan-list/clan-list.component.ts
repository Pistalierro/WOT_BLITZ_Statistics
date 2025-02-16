import {AfterViewInit, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {ClanService} from '../../../../services/clan/clan.service';
import {DatePipe, DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {BasicClanData, ExtendedClanDetails} from '../../../../models/clan/clan-response.model';
import {MatPaginator} from '@angular/material/paginator';
import {BreakpointObserver} from '@angular/cdk/layout';
import {DISPLAY_SIZE_LG_MIN, DISPLAY_SIZE_MD_LG, DISPLAY_SIZE_SM, DISPLAY_SIZE_SM_MD,} from '../../../../mock/clan-utils';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {debounceTime} from 'rxjs';

@Component({
  selector: 'app-clan-list',
  standalone: true,
  imports: [
    NgIf,
    ...MATERIAL_MODULES,
    DecimalPipe,
    DatePipe,
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './clan-list.component.html',
  styleUrl: './clan-list.component.scss'
})
export class ClanListComponent implements OnInit, AfterViewInit {
  clanService = inject(ClanService);
  displayedColumns: string[] = DISPLAY_SIZE_LG_MIN;
  dataSource = new MatTableDataSource<ExtendedClanDetails>([]);
  form!: FormGroup;
  suggestedClans: BasicClanData[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private fb = inject(FormBuilder);

  constructor() {
    effect(() => {
      const clanList = this.clanService.topClanDetails();
      if (clanList) this.dataSource.data = clanList;
    });

    this.breakpointObserver.observe([
      '(max-width: 992px)',
      '(max-width: 768px)',
      '(max-width: 576px)',
    ]).subscribe(result => {
      if (result.breakpoints['(max-width: 576px)']) {
        this.displayedColumns = DISPLAY_SIZE_SM;
      } else if (result.breakpoints['(max-width: 768px)']) {
        this.displayedColumns = DISPLAY_SIZE_SM_MD;
      } else if (result.breakpoints['(max-width: 992px)']) {
        this.displayedColumns = DISPLAY_SIZE_MD_LG;
      } else {
        this.displayedColumns = DISPLAY_SIZE_LG_MIN;
      }
    });
  }

  ngOnInit() {
    if (!this.clanService.topClanDetails()) {
      void this.clanService.getTopClanDetails();
    }
    void this.clanService.getTopClanDetails();
    this.initForm();
    this.setupSearchListener();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async updateAllData(): Promise<void> {
    await this.clanService.getAllClansData();
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

  navigateToClanDetails(clanId: number): void {
    void this.router.navigate(['/clans', clanId]);
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    const nameValue = this.form.value.name;
    const clanId = await this.clanService.getClanDetailsByName(nameValue);
    if (clanId) {
      this.navigateToClanDetails(clanId);
    } else {
      console.warn('Клан не найден, остаёмся на этой же странице');
    }
  }

  setupSearchListener(): void {
    this.form.get('name')!.valueChanges
      .pipe(debounceTime(300))
      .subscribe(async (searchTerm: string) => {
        this.suggestedClans = await this.clanService.suggestClans(searchTerm);
      });
  }

  async selectClan(clan: BasicClanData): Promise<void> {
    this.form.patchValue({name: `${clan.name} [${clan.tag}]`});
    this.suggestedClans = [];

    await this.clanService.getClanDetailsById(clan.clan_id);
    this.navigateToClanDetails(clan.clan_id);
  }
}

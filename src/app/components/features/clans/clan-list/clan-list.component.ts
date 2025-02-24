import {AfterViewInit, Component, effect, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ClanService} from '../../../../services/clan/clan.service';
import {DatePipe, DecimalPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {BasicClanData, ExtendedClanDetails} from '../../../../models/clan/clan-response.model';
import {MatPaginator} from '@angular/material/paginator';
import {BreakpointObserver} from '@angular/cdk/layout';
import {DISPLAY_SIZE_LG_MIN, DISPLAY_SIZE_MD_LG, DISPLAY_SIZE_SM, DISPLAY_SIZE_SM_MD,} from '../../../../mock/clan-utils';
import {Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {ClanUtilsService} from '../../../../services/clan/clan-utils.service';
import {UtilsService} from '../../../../shared/utils.service';

@Component({
  selector: 'app-clan-list',
  standalone: true,
  imports: [
    NgIf,
    ...MATERIAL_MODULES,
    DecimalPipe,
    DatePipe,
    ReactiveFormsModule,
    NgForOf,
    MatAutocompleteTrigger,
    NgClass
  ],
  templateUrl: './clan-list.component.html',
  styleUrl: './clan-list.component.scss'
})
export class ClanListComponent implements OnInit, AfterViewInit, OnDestroy {
  clanService = inject(ClanService);
  public utilsService = inject(UtilsService);
  displayedColumns: string[] = DISPLAY_SIZE_LG_MIN;
  dataSource = new MatTableDataSource<ExtendedClanDetails>([]);
  form!: FormGroup;
  clanControl = new FormControl('');
  suggestedClans: BasicClanData[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;
  private router = inject(Router);
  private openPanelTimeoutId: any;
  private breakpointObserver = inject(BreakpointObserver);
  private fb = inject(FormBuilder);
  private clanUtilsService = inject(ClanUtilsService);


  constructor() {
    effect(() => {
      const clanList = this.clanService.topClansDetails();
      if (clanList) this.dataSource.data = clanList;
    });

    this.breakpointObserver.observe([
      '(max-width: 1200px)',
      '(max-width: 768px)',
      '(max-width: 576px)',
    ]).subscribe(result => {
      if (result.breakpoints['(max-width: 576px)']) {
        this.displayedColumns = DISPLAY_SIZE_SM;
      } else if (result.breakpoints['(max-width: 768px)']) {
        this.displayedColumns = DISPLAY_SIZE_SM_MD;
      } else if (result.breakpoints['(max-width: 1200px)']) {
        this.displayedColumns = DISPLAY_SIZE_MD_LG;
      } else this.displayedColumns = DISPLAY_SIZE_LG_MIN;
    });
  }

  ngOnInit() {
    if (!this.clanService.topClansDetails()) {
      void this.clanService.getTopClansDetails();
    }
    this.initForm();
    this.setupSearchListener();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    if (this.openPanelTimeoutId) {
      clearTimeout(this.openPanelTimeoutId);
    }
  }

  async updateAllData(): Promise<void> {
    await this.clanService.getAllClansData();
    await this.clanService.getTopClansIds();
    await this.clanService.getTopClansDetails();
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
    console.log(`📌 Введённое значение: "${this.form.value.name}"`);
    const clanId = await this.clanService.getClanDetailsByNameOrTag(nameValue);
    if (clanId) {
      this.navigateToClanDetails(clanId);
    } else {
      console.warn('Клан не найден, остаёмся на этой же странице');
    }
  }

  setupSearchListener(): void {
    this.clanControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm: string | null) => {
        const query = typeof searchTerm === 'string' ? searchTerm : '';
        this.clanUtilsService.suggestClans(query).then(results => {
          this.suggestedClans = results;
          this.openPanelTimeoutId = setTimeout(() => {
            if (this.autoTrigger) {
              this.autoTrigger.updatePosition();
              this.autoTrigger.openPanel();
            }
          }, 200);
        });
      });
  }

  async selectClan(clan: BasicClanData): Promise<void> {
    this.form.patchValue({name: `${clan.name} [${clan.tag}]`});
    this.suggestedClans = [];
    if (this.autoTrigger) this.autoTrigger.closePanel();
    await this.clanService.getClanDetailsById(clan.clan_id);
    setTimeout(() => {
      this.navigateToClanDetails(clan.clan_id);
    }, 500);
  }
}

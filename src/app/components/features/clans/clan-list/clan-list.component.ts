import {AfterViewInit, Component, effect, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ClanService} from '../../../../services/clan/clan.service';
import {DatePipe, DecimalPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {MatTableDataSource} from '@angular/material/table';
import {BasicClanData, ExtendedClanDetails} from '../../../../models/clan/clan-response.model';
import {MatPaginator} from '@angular/material/paginator';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {ClanUtilsService} from '../../../../services/clan/clan-utils.service';
import {UtilsService} from '../../../../shared/utils.service';
import {TranslatePipe} from '@ngx-translate/core';

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
    NgClass,
    TranslatePipe
  ],
  templateUrl: './clan-list.component.html',
  styleUrl: './clan-list.component.scss'
})
export class ClanListComponent implements OnInit, AfterViewInit, OnDestroy {
  clanService = inject(ClanService);
  public utilsService = inject(UtilsService);
  displayedColumns: string[] = ['index', 'tag', 'name', 'leader_name', 'avgDamage', 'membersCount', 'created_at', 'winRate'];
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
      if (clanList) {
        this.dataSource.data = clanList;
      }
    });

    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium,]).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall]) {
        this.displayedColumns = ['index', 'tag', 'membersCount', 'winRate'];
      } else if (result.breakpoints[Breakpoints.Small]) {
        this.displayedColumns = ['index', 'tag', 'name', 'membersCount', 'winRate'];
      } else if (result.breakpoints[Breakpoints.Medium]) {
        this.displayedColumns = ['index', 'tag', 'name', 'membersCount', 'avgDamage', 'created_at', 'winRate'];
      } else this.displayedColumns = ['index', 'tag', 'name', 'leader_name', 'avgDamage', 'membersCount', 'created_at', 'winRate'];
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

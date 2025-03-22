import {inject, Injectable, signal} from '@angular/core';
import {SyncService} from '../shared/services/data/sync.service';
import {AggregatedStats, ExpTankStats, Tank} from '../models/tank/tanks-response.model';
import {FirestoreStorageService} from '../shared/services/data/firestore-storage.service';

@Injectable({providedIn: 'root'})
export class WN8Service {
  loading = signal<boolean>(false);
  private syncService = inject(SyncService);
  private firestoreService = inject(FirestoreStorageService);
  private blitzExpectedSignal = signal<ExpTankStats[]>([]);

  constructor() {
    void this.loadBlitzExpectedData();
  }

  async loadBlitzExpectedData(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.firestoreService.loadDataFromFirestore<{ data: ExpTankStats[] }>('jsonData', 'latest');
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        this.blitzExpectedSignal.set(res.data);
      } else {
        console.warn('[WN8Service] ❌ Нет WN8 данных в \'latest\'');
        this.blitzExpectedSignal.set([]);
      }
    } catch (error) {
      console.error('[WN8Service] ❌ Ошибка при загрузке WN8:', error);
      this.blitzExpectedSignal.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getBlitzExpectedList(): ExpTankStats[] {
    return this.blitzExpectedSignal();
  }

  calculateWn8ForAccount(tanks: Tank[]): number {
    const expMap = this.buildExpectedMap(this.getBlitzExpectedList());
    const agg = this.aggregateStats(tanks, expMap);
    return this.calculateWn8FromAggregated(agg);
  }

  calculateWn8ForTank(tank: Tank): number {
    if (!tank || !tank.all || tank.all.battles < 1) {
      console.warn(`[WN8] ❌ У танка ID=${tank?.tank_id} нет данных или боёв`);
      return 0;
    }

    const expMap = this.buildExpectedMap(this.getBlitzExpectedList());
    const exp = expMap.get(tank.tank_id);
    if (!exp) {
      console.warn(`[WN8] ❌ Нет ожидаемых значений для танка ID=${tank.tank_id}`);
      return 0;
    }
    const agg = this.aggregateStats([tank], expMap);
    return this.calculateWn8FromAggregated(agg);
  }


  private buildExpectedMap(list: ExpTankStats[]): Map<number, ExpTankStats> {
    const map = new Map<number, ExpTankStats>();
    list.forEach(e => map.set(e.IDNum, e));
    return map;
  }

  private aggregateStats(tanks: Tank[], expMap: Map<number, ExpTankStats>): AggregatedStats {
    const agg: AggregatedStats = {
      battles: 0,
      totalDmg: 0,
      totalSpot: 0,
      totalFrags: 0,
      totalDef: 0,
      totalWins: 0,

      sumExpDamage: 0,
      sumExpSpot: 0,
      sumExpFrag: 0,
      sumExpDef: 0,
      sumExpWins: 0
    };

    for (const tank of tanks) {
      if (!tank.all) {
        console.warn(`❌ Tank id=${tank.tank_id} has no .all field. Skipping...`);
        continue;
      }

      const battles = tank.all.battles ?? 0;
      if (battles < 1) continue;

      agg.battles += battles;
      agg.totalDmg += tank.all.damage_dealt ?? 0;
      agg.totalSpot += tank.all.spotted ?? 0;
      agg.totalFrags += tank.all.frags ?? 0;
      agg.totalDef += tank.all.dropped_capture_points ?? 0;
      agg.totalWins += tank.all.wins ?? 0;

      const exp = expMap.get(tank.tank_id);
      if (!exp) {
        // console.warn(`❓ No expected data for tank_id=${tank.tank_id}`);
        continue;
      }

      agg.sumExpDamage += exp.expDamage * battles;
      agg.sumExpSpot += exp.expSpot * battles;
      agg.sumExpFrag += exp.expFrag * battles;
      agg.sumExpDef += exp.expDef * battles;
      agg.sumExpWins += (exp.expWinRate / 100) * battles;
    }
    return agg;
  }

  private calculateWn8FromAggregated(agg: AggregatedStats): number {
    if (agg.battles < 1) return 0;

    const avgDmg = agg.totalDmg / agg.battles;
    const avgSpot = agg.totalSpot / agg.battles;
    const avgFrags = agg.totalFrags / agg.battles;
    const avgDef = agg.totalDef / agg.battles;
    const avgWr = (agg.totalWins / agg.battles) * 100;

    const expDmg = agg.sumExpDamage / agg.battles;
    const expSpot = agg.sumExpSpot / agg.battles;
    const expFrag = agg.sumExpFrag / agg.battles;
    const expDef = agg.sumExpDef / agg.battles;
    const expWr = (agg.sumExpWins / agg.battles) * 100;

    if (
      expDmg < 0.0001 ||
      expSpot < 0.0001 ||
      expFrag < 0.0001 ||
      expDef < 0.0001 ||
      expWr < 0.0001
    ) {
      console.warn('❌ Some expected values near 0 -> Infinity. Return WN8=0');
      return 0;
    }

    const rDAMAGE = avgDmg / expDmg;
    const rSPOT = avgSpot / expSpot;
    const rFRAG = avgFrags / expFrag;
    const rDEF = avgDef / expDef;
    const rWIN = avgWr / expWr;

    const rWINc = Math.max(0, (rWIN - 0.71) / (1 - 0.71));
    const rDAMAGEc = Math.max(0, (rDAMAGE - 0.22) / (1 - 0.22));
    const rFRAGc = Math.max(0, Math.min(rDAMAGEc + 0.2, (rFRAG - 0.12) / (1 - 0.12)));
    const rSPOTc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rSPOT - 0.38) / (1 - 0.38)));
    const rDEFc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rDEF - 0.10) / (1 - 0.10)));

    const wn8 = (980 * rDAMAGEc)
      + (210 * rDAMAGEc * rFRAGc)
      + (155 * rFRAGc * rSPOTc)
      + (75 * rDEFc * rFRAGc)
      + (145 * Math.min(1.8, rWINc));

    return Math.round(wn8);
  }
}

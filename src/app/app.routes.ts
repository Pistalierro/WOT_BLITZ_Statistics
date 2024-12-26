import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';

export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {
    path: 'players',
    loadComponent: () =>
      import('./components/statistics/player-statistics/player-statistics.component').then(
        (m) => m.PlayerStatisticsComponent
      ),
    title: 'WOT Blitz Statistics'
  },

];

import {Component} from '@angular/core';
import {PlayerStatisticsComponent} from './components/statistics/player-statistics/player-statistics.component';
import {HeaderComponent} from './components/layouts/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PlayerStatisticsComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}

import {Component} from '@angular/core';
import {PlayerStatisticsComponent} from './components/statistics/player-statistics/player-statistics.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PlayerStatisticsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}

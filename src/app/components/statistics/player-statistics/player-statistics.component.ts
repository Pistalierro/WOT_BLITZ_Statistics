import {Component, inject, OnInit} from '@angular/core';
import {PlayerService} from '../../../services/player.service';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-player-statistics',
  standalone: true,
  imports: [
    NgIf,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './player-statistics.component.html',
  styleUrl: './player-statistics.component.scss'
})
export class PlayerStatisticsComponent implements OnInit {

  accountId = '598389904';
  clanId: number = 220847;
  playerService = inject(PlayerService);

  ngOnInit() {
    this.playerService.getPlayerInfo(this.accountId);
    this.playerService.getClanInfo(this.clanId);
  }
}

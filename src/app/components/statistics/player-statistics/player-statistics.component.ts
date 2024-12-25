import {Component, effect, inject} from '@angular/core';
import {PlayerService} from '../../../services/player.service';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ClanService} from '../../../services/clan.service';

@Component({
  selector: 'app-player-statistics',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,

  ],
  templateUrl: './player-statistics.component.html',
  styleUrl: './player-statistics.component.scss'
})
export class PlayerStatisticsComponent {

  searchQuery: string = 'PISTALIERRO';
  playerService = inject(PlayerService);
  clanService = inject(ClanService);
  playerInfo = this.playerService.playerInfo;
  clanInfo = this.clanService.clanInfo;
  errorMessage = this.playerService.error;

  constructor() {
    effect(() => {
      const accountId = this.playerService.playerId();
      if (accountId) {
        this.playerService.getPlayerInfo(accountId);
        this.clanService.getClanId(accountId);
      }

    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.errorMessage.set('Введите ник или ID игрока.');
      return;
    }
    this.errorMessage.set(null);

    if (/^\d+$/.test(query)) {
      this.playerService.playerId.set(+query);
    } else {
      this.playerService.searchPlayer(query);
    }
  }

  getWinRate(): string {
    const player = this.playerInfo();
    if (!player || !player.statistics?.all?.battles) {
      return '0.00';
    }
    return ((player.statistics.all.wins / player.statistics.all.battles) * 100).toFixed(2); // Форматируем результат
  };

  getDate(timestamp: number): string {
    if (!timestamp) {
      return 'Неизвестно';
    }
    return new Date(timestamp * 1000).toLocaleDateString();
  }


  getAccuracy(): string {
    const player = this.playerInfo();
    if (!player || !player.statistics?.all?.hits || !player.statistics?.all?.shots) {
      return 'Неизвестно';
    }
    return ((player.statistics.all.hits / player.statistics.all.shots) * 100).toFixed(2); // Округляем до 2 знаков после запятой
  }

  getSurvivalRate(): string {
    const player = this.playerInfo();
    if (!player || !player.statistics?.all?.battles) {
      return '0.00%'; // Возвращаем 0%, если данных нет
    }
    return ((player.statistics.all.survived_battles / player.statistics.all.battles) * 100).toFixed(2); // Форматируем до 2 знаков после запятой
  }
}

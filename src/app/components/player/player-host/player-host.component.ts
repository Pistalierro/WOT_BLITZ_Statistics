import {Component, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {FormsModule} from '@angular/forms';
import {PlayerService} from '../../../services/player.service';
import {ClanService} from '../../../services/clan.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-player-host',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    ...MATERIAL_MODULES,
    FormsModule,
    NgIf,
    RouterLinkActive
  ],
  templateUrl: './player-host.component.html',
  styleUrl: './player-host.component.scss',
})
export class PlayerHostComponent {
  searchQuery: string = 'PISTALIERRO';
  private playerService = inject(PlayerService);
  private clanService = inject(ClanService);
  private router = inject(Router);

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      alert('Введите ник или ID игрока.');
      return;
    }

    if (/^\d+$/.test(query)) {
      this.playerService.playerId.set(Number(query));
      this.playerService.getPlayerInfo(Number(query));
      this.clanService.getClanId(Number(query));
    } else {
      this.playerService.searchPlayer(query);
    }

    this.router.navigate(['/players/statistics']);
  }

  isPlayerSelected(): boolean {
    return !!this.playerService.playerId(); // Проверяем, выбран ли игрок
  }
}

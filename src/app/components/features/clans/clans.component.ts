import {Component, inject, OnInit} from '@angular/core';
import {ClanService} from '../../../services/clan.service';

@Component({
  selector: 'app-clans',
  standalone: true,
  imports: [],
  templateUrl: './clans.component.html',
  styleUrl: './clans.component.scss'
})
export class ClansComponent implements OnInit {

  clanService = inject(ClanService);

  ngOnInit() {
    this.clanService.getClanId();
  }
}

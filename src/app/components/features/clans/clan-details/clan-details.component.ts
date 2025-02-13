import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-clan-details',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './clan-details.component.html',
  styleUrl: './clan-details.component.scss'
})
export class ClanDetailsComponent {

}

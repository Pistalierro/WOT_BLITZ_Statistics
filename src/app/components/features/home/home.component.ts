import {Component} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {MATERIAL_MODULES} from '../../../mock/material-providers';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [...MATERIAL_MODULES],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({opacity: 0})),
      state('*', style({opacity: 1})),
      transition('void => *', animate('500ms ease-in')),
      transition('* => void', animate('500ms ease-out'))
    ])
  ]
})
export class HomeComponent {

}

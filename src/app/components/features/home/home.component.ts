import {Component} from '@angular/core';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {ANIMATIONS} from '../../../shared/helpers/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [...MATERIAL_MODULES],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [ANIMATIONS.slideIn]
})
export class HomeComponent {

}

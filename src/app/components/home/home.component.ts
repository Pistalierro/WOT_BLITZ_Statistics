import {Component} from '@angular/core';
import {MATERIAL_MODULES} from '../../mock/material-providers';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [...MATERIAL_MODULES],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}

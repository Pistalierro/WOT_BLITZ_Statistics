import {Component} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [...MATERIAL_MODULES],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  
}

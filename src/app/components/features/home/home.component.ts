import {Component} from '@angular/core';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {ANIMATIONS} from '../../../shared/helpers/animations';
import {TranslatePipe} from '@ngx-translate/core';
import {RouterLink} from '@angular/router';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [...MATERIAL_MODULES, TranslatePipe, RouterLink, NgForOf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [ANIMATIONS.slideIn]
})
export class HomeComponent {

}

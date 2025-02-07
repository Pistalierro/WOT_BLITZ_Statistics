import {Component} from '@angular/core';
import {HeaderComponent} from './components/layouts/header/header.component';
import {FooterComponent} from './components/layouts/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}

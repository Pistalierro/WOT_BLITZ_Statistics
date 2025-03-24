import {Component, inject, OnInit} from '@angular/core';
import {HeaderComponent} from './components/layouts/header/header.component';
import {VisitTrackerService} from './shared/services/visit-tracker.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  private visitTracker = inject(VisitTrackerService);

  ngOnInit() {
    void this.visitTracker.logVisit();
  }

}

import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {PlayerStoreService} from '../../../../services/player/player-store.service';

@Component({
  selector: 'app-player-host',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterLink, RouterOutlet, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './player-host.component.html',
  styleUrl: './player-host.component.scss'
})
export class PlayerHostComponent implements OnInit {
  searchPlayerForm!: FormGroup;
  protected authService = inject(AuthService);
  protected playerStoreService = inject(PlayerStoreService);
  private fb = inject(FormBuilder);

  ngOnInit() {
    this.initializeForm();
  }

  onSubmit() {
    const nickname: string = this.searchPlayerForm.value.name;
    if (nickname && nickname.trim().length) {
      this.playerStoreService.getPlayerData(nickname).then();
    }
    this.searchPlayerForm.reset();
  }

  private initializeForm() {
    this.searchPlayerForm = this.fb.group({
      name: ['', Validators.required],
    });
  }
}

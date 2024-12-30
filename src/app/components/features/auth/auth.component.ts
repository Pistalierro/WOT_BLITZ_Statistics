import {Component, inject, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [...MATERIAL_MODULES, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  isLoginMode: boolean = true;
  authForm!: FormGroup;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.initializeForm();
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    if (this.isLoginMode) {
      this.authForm.removeControl('confirmPassword');
      this.authForm.removeControl('nickname');
    } else {
      this.authForm.addControl(
        'confirmPassword',
        this.fb.control('', [Validators.required, this.matchPasswordValidator])
      );
      this.authForm.addControl(
        'nickname',
        this.fb.control('', [Validators.required])
      );
    }
  }

  onSubmit() {
    if (this.authForm.valid) {
      const {email, password, nickname} = this.authForm.value;

      if (this.isLoginMode) {
        console.log('Вход с данными:', {email, password});
        // this.authService.login(email, password);
      } else {
        console.log('Регистрация с данными:', {email, password, nickname});
        // Вызов AuthService для регистрации
      }
    }
  }

  private matchPasswordValidator = (control: any) => {
    if (control.parent && control.value !== control.parent.get('password')?.value) {
      return {passwordsMismatch: true};
    }
    return null;
  };

  private initializeForm(): void {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: [''],
      nickname: [''],
    });
  }
}

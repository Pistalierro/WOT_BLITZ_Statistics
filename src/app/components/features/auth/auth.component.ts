import {Component, inject, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {NgIf} from '@angular/common';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Router} from '@angular/router';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [...MATERIAL_MODULES, ReactiveFormsModule, NgIf],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  animations: [
    trigger('buttonState', [
      state(
        'default',
        style({
          backgroundColor: '#3f51b5',
          transform: 'scale(1)',
        })
      ),
      state(
        'success',
        style({
          backgroundColor: '#4caf50',
          transform: 'scale(1.1)',
        })
      ),
      transition('default => success', [animate('300ms ease-in')]),
      transition('success => default', [animate('300ms ease-out')]),
    ]),
  ],
})
export class AuthComponent implements OnInit {
  isLoginMode: boolean = true;
  authForm!: FormGroup;
  buttonState: 'default' | 'success' = 'default';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<AuthComponent>);

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
      this.buttonState = 'success';
      const {email, password, nickname} = this.authForm.value;

      if (this.isLoginMode) {
        console.log('Вход с данными:', {email, password});
        this.authService.login(email, password).then(() => {
          this.onLoginSuccess();
        }).catch(err => {
          console.error('Ошибка входа:', err);
          this.buttonState = 'default'; // Сброс анимации при ошибке
        });
      } else {
        console.log('Регистрация с данными:', {email, password, nickname});
        this.authService.register(email, password, nickname).then(() => {
          this.onRegisterSuccess();
        }).catch(err => {
          console.error('Ошибка регистрации:', err);
          this.buttonState = 'default'; // Сброс анимации при ошибке
        });
      }
    }
  }

  private onLoginSuccess() {
    this.buttonState = 'success';
    setTimeout(() => {
      this.dialogRef.close();
      this.router.navigate(['/players']);
    }, 300); // Закрытие после завершения анимации
  }

  private onRegisterSuccess() {
    this.buttonState = 'success';
    setTimeout(() => {
      this.dialogRef.close();
      this.router.navigate(['/players']);
    }, 300); // Закрытие после завершения анимации
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
    });
  }
}

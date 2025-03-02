import {Component, inject, OnInit} from '@angular/core';
import {MATERIAL_MODULES} from '../../../shared/helpers/material-providers';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {NgIf} from '@angular/common';
import {Router} from '@angular/router';
import {MatDialogRef} from '@angular/material/dialog';
import {ANIMATIONS} from '../../../shared/helpers/animations';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [...MATERIAL_MODULES, ReactiveFormsModule, NgIf, TranslatePipe],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  animations: [ANIMATIONS.buttonState],
})
export class AuthComponent implements OnInit {
  isLoginMode: boolean = true;
  authForm!: FormGroup;
  buttonState: 'default' | 'success' = 'default';
  protected readonly sessionStorage = sessionStorage;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<AuthComponent>);

  ngOnInit(): void {
    this.initializeForm();
  }

  toggleMode(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
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
      this.router.navigate(['/players']).then();
    }, 100); // Закрытие после завершения анимации
  }

  private onRegisterSuccess() {
    this.buttonState = 'success';
    setTimeout(() => {
      this.dialogRef.close();
      this.router.navigate(['/players']).then();
    }, 100); // Закрытие после завершения анимации
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

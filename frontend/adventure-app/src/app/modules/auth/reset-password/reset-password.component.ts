import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  email: string | null = null;
  otpForm!: FormGroup;
  passwordForm!: FormGroup;
  
  loading = false;
  currentStep: 'otp' | 'password' = 'otp'; // Controls which form is shown

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notify: NotificationService
  ) {
    // Get the email passed from the previous component
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras?.state?.['email'];
  }

  ngOnInit(): void {
    if (!this.email) {
      this.notify.error('No email provided. Please start over.', 'Error');
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onVerifyOtp(): void {
    if (this.otpForm.invalid || !this.email) return;

    this.loading = true;
    const otp = this.otpForm.value.otp;

    this.authService.verifyOtp(this.email, otp).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('OTP verified!', 'Success');
        this.currentStep = 'password'; // Move to the next step
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.message || 'Failed to verify OTP.', 'Error');
      }
    });
  }

  onResetPassword(): void {
    if (this.passwordForm.invalid || !this.email) return;

    this.loading = true;
    const otp = this.otpForm.value.otp; // We still need the verified OTP
    const password = this.passwordForm.value.password;

    this.authService.resetPassword(this.email, otp, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.notify.success(response.message, 'Password Reset!');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.message || 'Failed to reset password.', 'Error');
      }
    });
  }
}
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.loginForm.reset();
    // Ensure form starts in invalid state
    this.loginForm.markAsUntouched();
    this.loginForm.markAsPristine();
  }

  ngAfterViewInit(): void {
    // Prevent re-injection of Google script
    setTimeout(() => {
      this.clearAutofillValues();
    }, 100);
    if (document.getElementById('google-gsi-script')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      google.accounts.id.initialize({
        client_id: '388697978029-349nkl94aui14ja21365u633kjkm9uar.apps.googleusercontent.com',
        callback: (response: any) => {
          console.log('✅ Google sign-in callback', response);
          this.loading = true;
          this.error = '';

          this.auth.exchangeGoogleToken(response.credential).subscribe({
            next: () => {
              this.router.navigate(['/dashboard']);
            },
            error: err => {
              this.error = err.message || 'Google sign-in failed';
              this.loading = false;
            },
            complete: () => {
              this.loading = false;
            }
          });
        }
      });

      // Fix: Render button directly in component instead of calling AuthService
      const container = document.getElementById('google-signin-button');
      if (container) {
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: container.clientWidth
        });
      } else {
        console.warn('Google Sign-In container not found');
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      this.error = 'Failed to load Google Sign-In. Please try again.';
    };

    document.head.appendChild(script);
  }
   private clearAutofillValues(): void {
    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');
    
    // Only clear if values seem to be autofilled (value exists but user hasn't interacted)
    if (emailControl?.value && !emailControl.dirty) {
      emailControl.setValue('');
    }
    if (passwordControl?.value && !passwordControl.dirty) {
      passwordControl.setValue('');
    }
    
    // Reset the form state to clean
    this.loginForm.markAsUntouched();
    this.loginForm.markAsPristine();
  }

  // Method to check if form is completely valid
  isFormValid(): boolean {
    return this.loginForm.valid &&
      this.loginForm.get('email')?.value?.trim() !== '' &&
      this.loginForm.get('password')?.value?.trim() !== '';
  }

  onSubmit(): void {
    // Double-check form validity
    if (this.loginForm.invalid || !this.isFormValid()) {
      this.loginForm.markAllAsTouched();
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    // Prepare login data
    const loginData = {
      email: this.loginForm.value.email.trim(),
      password: this.loginForm.value.password
    };

    this.auth.login(loginData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onGoogleSignIn(): void {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
    } else {
      console.error('Google Sign-In API not available');
      this.error = 'Google Sign-In is not available. Please refresh the page.';
    }
  }
}
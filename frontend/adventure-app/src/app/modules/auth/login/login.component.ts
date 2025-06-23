import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm!: FormGroup;
  loading = false;
  error = ''; // <-- THIS PROPERTY IS NOW ADDED BACK

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  ngAfterViewInit(): void {
    if (document.getElementById('google-gsi-script')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          this.zone.run(() => {
            this.handleGoogleSignIn(response.credential);
          });
        }
      });

      const container = document.getElementById('google-signin-button');
      if (container) {
        google.accounts.id.renderButton(container, {
          theme: 'outline', size: 'large', text: 'signin_with', width: '320'
        });
      }
    };

    script.onerror = () => {
      this.notify.error('Failed to load Google Sign-In script.', 'Error');
    };

    document.head.appendChild(script);
  }

  handleGoogleSignIn(credential: string): void {
    this.loading = true;
    this.auth.exchangeGoogleToken(credential).subscribe({
      next: () => {
        this.router.navigate(['/']);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }


  isFormValid(): boolean {
    if (!this.loginForm) return false;
    return this.loginForm.valid;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/']);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onGoogleSignIn(): void {
    this.auth.googleSignIn();
  }
}
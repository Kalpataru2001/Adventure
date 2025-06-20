import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dob: ['', [Validators.required, this.ageValidator]]
    });

    this.registerForm.markAsUntouched();
  }

  isFormValid(): boolean {
    return this.registerForm.valid && 
           this.registerForm.get('firstName')?.value?.trim() !== '' &&
           this.registerForm.get('lastName')?.value?.trim() !== '' &&
           this.registerForm.get('email')?.value?.trim() !== '' &&
           this.registerForm.get('password')?.value?.trim() !== '' &&
           this.registerForm.get('dob')?.value !== '';
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

      // Render Google button directly
      const container = document.getElementById('google-signin-button');
      if (container) {
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: container.clientWidth
        });
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      this.error = 'Failed to load Google Sign-In. Please try again.';
    };

    document.head.appendChild(script);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.isFormValid()) {
      this.registerForm.markAllAsTouched();
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = {
      firstName: this.registerForm.value.firstName.trim(),
      lastName: this.registerForm.value.lastName.trim(),
      email: this.registerForm.value.email.trim(),
      password: this.registerForm.value.password,
      dob: this.registerForm.value.dob
    };

    this.auth.register(formData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.error = err.error?.message || 'Registration failed';
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
      this.error = 'Google Sign-In is not available. Please refresh the page.';
    }
  }

  private ageValidator(control: any) {
    if (!control.value) return null;
    
    const today = new Date();
    const birthDate = new Date(control.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 13 ? null : { ageInvalid: true };
  }
}
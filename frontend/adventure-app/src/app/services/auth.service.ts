// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { NotificationService } from './notification.service';
import { environment } from 'src/environments/environment';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://localhost:44384/api/Auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notify: NotificationService
  ) {
    // The call to restoreSession() is removed from here.
  }

  // ==================== NEW METHOD FOR APP_INITIALIZER ====================
  /**
   * This is called on app startup. It checks for a token and validates it
   * against the backend's /me endpoint before the app renders.
   * It returns an Observable that must complete for the app to continue.
   */
  public initializeAuthState(): Observable<User | null> {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return this.http.get<User>(`${this.API_URL}/me`).pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      );
    } else {
      this.clearSession();
      return of(null);
    }
  }
  // =======================================================================


  // --- All your other methods remain the same ---

  register(data: RegisterRequest): Observable<void> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(resp => this.saveSession(resp)),
      map(() => {
        this.notify.success('Account created successfully! Welcome aboard!', 'Registration Successful');
      }),
      catchError(err => {
        const msg = err.error?.message || 'Registration failed. Please try again.';
        this.notify.error(msg, 'Registration Error');
        return throwError(() => err);
      })
    );
  }

  login(data: LoginRequest): Observable<void> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, data).pipe(
      tap(resp => this.saveSession(resp)),
      map(() => {
        this.notify.success('Welcome back!', 'Login Successful');
      }),
      catchError(err => {
        const msg = err.error?.message || 'Login failed. Please check your credentials.';
        this.notify.error(msg, 'Login Error');
        return throwError(() => err);
      })
    );
  }

  googleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!google?.accounts?.id) { return reject(new Error('Google SDK not loaded.')); }
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (res: any) => {
          this.exchangeGoogleToken(res.credential).subscribe({
            next: () => { this.notify.success('Successfully signed in with Google!', 'Welcome'); resolve(); },
            error: err => reject(err)
          });
        }
      });
      google.accounts.id.prompt();
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.API_URL}/verify-otp`, { email, otp });
  }
  
  resetPassword(email: string, otp: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, { email, otp, password });
  }

  public exchangeGoogleToken(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/google-login`, { idToken: token }).pipe(
      tap(resp => this.saveSession(resp)),
      catchError(err => {
        const msg = err.error?.message || 'Google authentication failed';
        this.notify.error(msg, 'Authentication Error');
        return throwError(() => err);
      })
    );
  }

  // --- Updated Session Management Methods ---

  private clearSession() {
    localStorage.removeItem('token');
    // We no longer need to manage the 'user' item in local storage
    this.currentUserSubject.next(null);
  }

  private saveSession(resp: AuthResponse) {
    const { token, email, firstName, lastName } = resp;
    localStorage.setItem('token', token);
    const user: User = { email, firstName, lastName };
    // The user state is now set directly in the BehaviorSubject
    this.currentUserSubject.next(user);
  }

  logout() {
    this.clearSession();
    this.notify.info('You have been logged out.', 'Logged Out');
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // The old getCurrentUser() method is no longer needed for session restoration,
  // but it can be kept if other parts of your app call it directly.
  // The logic inside initializeAuthState is now the primary method.
}
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { NotificationService } from './notification.service';
import { environment } from 'src/environments/environment';
import { NotificationStateService } from './notification-state.service';
import { RealtimeNotificationService } from './realtime-notification.service';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl + '/Auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notify: NotificationService,
    private notificationState: NotificationStateService,
    private realtimeNotificationService: RealtimeNotificationService,
    private zone: NgZone
  ) { }

  public initializeAuthState(): Observable<User | null> {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return this.http.get<User>(`${this.API_URL}/me`).pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.startRealtimeServices();
        }),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    } else {
      this.clearLocalSession();
      return of(null);
    }
  }


  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(resp => {
        this.saveSession(resp);
        this.notify.success('Account created successfully!', 'Welcome');
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, data).pipe(
      tap(resp => {
        this.saveSession(resp); // Handle session and start services here
        this.notify.success('Welcome back!', 'Login Successful');
      }),
      catchError(err => {
        this.notify.error(err.error?.message || 'Login failed.', 'Error');
        return throwError(() => err);
      })
    );
  }

  private saveSessionAndStartServices(resp: AuthResponse) {
    localStorage.setItem('token', resp.token);
    const user: User = { email: resp.email, firstName: resp.firstName, lastName: resp.lastName };
    this.currentUserSubject.next(user);
    this.startRealtimeServices();
  }

  googleSignIn(): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      this.notify.error('Google Sign-In is not available. Please refresh.', 'Error');
    }
  }

  // THIS METHOD IS PUBLIC and handles saving the session internally.
  public exchangeGoogleToken(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/google-login`, { idToken: token }).pipe(
      tap(resp => this.saveSession(resp)), // Handle session and start services here
      catchError(err => {
        this.notify.error(err.error?.message || 'Google authentication failed', 'Authentication Error');
        return throwError(() => err);
      })
    );
  }


  private saveSession(resp: AuthResponse) {
    localStorage.setItem('token', resp.token);
    const user: User = { email: resp.email, firstName: resp.firstName, lastName: resp.lastName };
    this.currentUserSubject.next(user);
    this.startRealtimeServices();
  }

  private startRealtimeServices(): void {
    console.log("AuthService: Starting real-time services..."); // For debugging
    this.notificationState.fetchFriendRequestCount();
    this.realtimeNotificationService.startConnection();
  }

  logout() {
    this.realtimeNotificationService.stopConnection();
    this.clearLocalSession();
    this.notify.info('You have been logged out.', 'Logged Out');
    this.router.navigate(['/auth/login']);
  }

  private clearLocalSession() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  // Other methods remain unchanged
  forgotPassword(email: string): Observable<any> { return this.http.post(`${this.API_URL}/forgot-password`, { email }); }
  verifyOtp(email: string, otp: string): Observable<any> { return this.http.post(`${this.API_URL}/verify-otp`, { email, otp }); }
  resetPassword(email: string, otp: string, password: string): Observable<any> { return this.http.post(`${this.API_URL}/reset-password`, { email, otp, password }); }
  getToken(): string | null { return localStorage.getItem('token'); }
  isAuthenticated(): boolean { const token = this.getToken(); return !!token && !this.isTokenExpired(token); }
  private isTokenExpired(token: string): boolean { try { const payload = JSON.parse(atob(token.split('.')[1])); return payload.exp * 1000 < Date.now(); } catch { return true; } }
}
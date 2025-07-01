import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { Challenge } from '../models/challenge.model';
import { environment } from 'src/environments/environment';
import { BookingStateService } from './booking-state.service';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
   private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
     private bookingState: BookingStateService 
  ) { }

  getChallenges(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${this.apiUrl}/Challenges`).pipe(
      catchError(error => {
        console.error('Failed to fetch challenges:', error);
        return of([]); 
      })
    );
  }
   acceptChallenge(challengeId: string): Observable<any> {
    // return this.http.post(`${this.apiUrl}/Challenges/accept`, { challengeId });
     return this.http.post(`${this.apiUrl}/Challenges/accept`, { challengeId }).pipe(
      tap(() => {
        this.bookingState.incrementNewBookingsCount();
      })
    );
  }

   getMyAcceptedChallengeIds(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/Challenges/my-completions`).pipe(
      catchError(error => {
        console.error('Failed to fetch user completions:', error);
        return of([]);
      })
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActiveChallenge } from '../models/booking.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiUrl = environment.apiUrl + '/Bookings';

  constructor(private http: HttpClient) { }

  getMyActiveChallenges(): Observable<ActiveChallenge[]> {
    return this.http.get<ActiveChallenge[]>(`${this.apiUrl}/my-challenges`);
  }

  completeChallenge(completionId: string, postText: string | null, file: File): Observable<any> {
    const formData = new FormData();
    if (postText) {
      formData.append('postText', postText);
    }
    formData.append('file', file, file.name);

    return this.http.post(`${this.apiUrl}/${completionId}/complete`, formData);
  }
  updateStreak(): Observable<any> {
    return this.http.post(`${this.apiUrl}/../streaks/update`, {}); // Note the relative path
  }
}
// src/app/services/friend.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

export interface User { id: string; firstName: string; lastName: string; avatarUrl: string | null; }
export interface FriendRequest { requesterId: string; firstName: string; lastName: string; avatarUrl: string | null; }


@Injectable({ providedIn: 'root' })
export class FriendService {
  private readonly apiUrl = 'https://localhost:44384/api/Friends';
  constructor(private http: HttpClient) { }

  findNewFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/find`);
  }
  getIncomingRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/incoming`);
  }

  sendFriendRequest(addresseeId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request/${addresseeId}`, {});
  }

  acceptFriendRequest(requesterId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/accept/${requesterId}`, {});
  }

  declineFriendRequest(requesterId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/decline/${requesterId}`, {});
  }

  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${friendId}`);
  }
  getIncomingRequestCount(): Observable<number> {
  return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/incoming`).pipe(
    map(requests => requests.length), // Transform the array into its length
    catchError(() => of(0)) // Return 0 if there's an error
  );
}
  // You would also add methods to get pending requests and a list of all users.
}
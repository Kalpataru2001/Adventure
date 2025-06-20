import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// This is the model for the data we expect from the API.
// It's good practice to define it.
export interface ProfileData {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    memberSince: string;
    level: number;
    stats: {
        totalAdventures: number;
        currentStreak: number;
        friendsCount: number;
    };
    badges: {
        name: string;
        iconUrl: string; // This will hold the emoji, e.g., '🍜'
    }[];
}
export interface HomeStats {
    totalAdventures: number;
    badgesCount: number;
    currentStreak: number;
    friendsCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private readonly apiUrl = 'https://localhost:44384/api/Profile';

    constructor(private http: HttpClient) { }

    getProfileData(): Observable<ProfileData | null> {
        // The AuthInterceptor will automatically add the user's token to this request.
        return this.http.get<ProfileData>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Failed to fetch profile data:', error);
                return of(null); // Return null if the API call fails
            })
        );
    }
    updateProfile(firstName: string, lastName: string): Observable<any> {
        return this.http.put(this.apiUrl, { firstName, lastName });
    }
    updateAvatar(avatarUrl: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/avatar`, { avatarUrl });
    }
    uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        // The backend endpoint is /api/profile/avatar
        return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/avatar`, formData);
    }
    getHomeStats(): Observable<HomeStats | null> {
        return this.http.get<HomeStats>(`${this.apiUrl}/home-stats`).pipe(
            catchError(() => of(null))
        );
    }
}
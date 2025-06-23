import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MapPin {
  title: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly apiUrl = environment.apiUrl + '/Dashboard';

  constructor(private http: HttpClient) { }

  getMapData(): Observable<MapPin[]> {
    return this.http.get<MapPin[]>(`${this.apiUrl}/map-data`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actorAvatarUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = environment.apiUrl + '/Notifications';

  constructor(private toastr: ToastrService, private http: HttpClient) { }

  success(message: string, title: string = 'Success') {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Error') {
    this.toastr.error(message, title);
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title);
  }

  warning(message: string, title: string = 'Warning') {
    this.toastr.warning(message, title);
  }
  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-as-read`, {});
  }
}

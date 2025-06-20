import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
// We no longer import AuthService here, which breaks the circle.
import { NotificationService } from './notification.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RealtimeNotificationService {
  private hubConnection?: signalR.HubConnection;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // --- THIS IS THE FIX ---
  // The constructor no longer injects AuthService.
  constructor(private toastr: NotificationService) {}

  public startConnection(): void {
    // Get the token directly from localStorage when the connection starts.
    const token = localStorage.getItem('token'); 
    if (!token) {
      console.log('No token found, not starting SignalR connection.');
      return;
    }

    // If a connection already exists, don't start a new one.
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
        return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:44384/notificationHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => console.error('Error while starting SignalR connection: ', err));

    this.hubConnection.on('ReceiveNotification', (message: string) => {
      this.toastr.info(message, 'New Notification');
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    });
  }

  public stopConnection(): void {
    if (this.hubConnection) {
        this.hubConnection.stop()
            .then(() => console.log('SignalR Connection stopped'));
    }
  }

  public markAsRead() {
      this.unreadCountSubject.next(0);
      // You would also call an API endpoint here to mark them as read in the database.
  }
}
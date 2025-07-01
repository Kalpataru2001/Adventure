import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
import { NotificationStateService } from 'src/app/services/notification-state.service';
import { Notification, NotificationService } from 'src/app/services/notification.service';
import { RealtimeNotificationService } from 'src/app/services/realtime-notification.service'; // <-- Import this
import { BookingStateService } from 'src/app/services/booking-state.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  open = false;
  isNotificationsOpen = false;
  notifications: Notification[] = [];
  isLoadingNotifications = false;

  constructor(
    public authService: AuthService,
    public notificationState: NotificationStateService, // For friend request badge
    public realtimeNotificationService: RealtimeNotificationService, // <-- Inject this for the bell badge
    private notificationService: NotificationService, // For API calls
     public bookingState: BookingStateService,
  ) { }

  toggleMenu() { this.open = !this.open; }
  closeMenu() { this.open = false; }

  onLogout(): void {
    this.closeMenu();
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out.",
      icon: 'warning',
      confirmButtonText: 'Yes, log me out!'
    }).then((result) => {
      if (result.isConfirmed) { this.authService.logout(); }
    });
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;

    if (this.isNotificationsOpen) {
      this.fetchNotifications();
      // Mark notifications as read when the panel opens
      this.markNotificationsAsRead();
    }
  }

  fetchNotifications(): void {
    this.isLoadingNotifications = true;
    this.notificationService.getMyNotifications().subscribe(data => {
      this.notifications = data;
      this.isLoadingNotifications = false;
    });
  }

  markNotificationsAsRead(): void {
    // --- THIS IS THE FIX ---
    // Use the new getter to access the current value.
    if (this.realtimeNotificationService.currentUnreadCount > 0) {
      this.realtimeNotificationService.markAsRead();
      this.notificationService.markAllAsRead().subscribe();
    }
  }

  closeNotifications(): void {
    this.isNotificationsOpen = false;
  }
}
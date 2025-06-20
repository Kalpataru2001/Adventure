import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
import { NotificationStateService } from 'src/app/services/notification-state.service';
import { Notification, NotificationService } from 'src/app/services/notification.service';

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
    public notificationState: NotificationStateService,
    private notificationService: NotificationService
  ) {}

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

  // --- CORRECTED NOTIFICATION LOGIC ---

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    
    if (this.isNotificationsOpen) {
      this.fetchNotifications();
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
    // Use the new getter for the current value
    const unreadCount = this.notificationState.currentFriendRequestCount; 
    
    if (unreadCount > 0) {
      // For now, we assume clicking the bell clears friend request notifications
      this.notificationState.setFriendRequestCount(0);
      
      this.notificationService.markAllAsRead().subscribe(); 
    }
  }

  closeNotifications(): void {
    this.isNotificationsOpen = false;
  }
}
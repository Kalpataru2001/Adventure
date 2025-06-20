import { Component, OnInit } from '@angular/core';
import { FriendService, User } from 'src/app/services/friend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-find-friends',
  templateUrl: './find-friends.component.html',
  styleUrls: ['./find-friends.component.scss']
})
export class FindFriendsComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  // This set will store the IDs of users to whom a request has just been sent
  sentRequests = new Set<string>();

  constructor(
    private friendService: FriendService,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.friendService.findNewFriends().subscribe(data => {
      this.users = data;
      this.isLoading = false;
    });
  }

  sendRequest(user: User) {
    // Immediately update the UI for an instant feel
    this.sentRequests.add(user.id);

    this.friendService.sendFriendRequest(user.id).subscribe({
      next: () => {
        this.notify.success(`Friend request sent to ${user.firstName}!`);
        // The UI is already updated, so we don't need to do anything else on success
      },
      error: (err) => {
        // If the request fails, roll back the UI change and show an error
        this.sentRequests.delete(user.id);
        this.notify.error(err.error?.message || 'Failed to send request.');
      }
    });
  }
}

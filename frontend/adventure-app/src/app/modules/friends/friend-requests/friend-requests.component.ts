import { Component, OnInit } from '@angular/core';
import { FriendRequest, FriendService } from 'src/app/services/friend.service';
import { NotificationStateService } from 'src/app/services/notification-state.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent implements OnInit {
  requests: FriendRequest[] = [];
  isLoading = true;

  constructor(
    private friendService: FriendService, 
    private notify: NotificationService,
    private notificationState: NotificationStateService
  ) 
    {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.friendService.getIncomingRequests().subscribe(data => {
      this.requests = data;
      this.isLoading = false;
    });
  }
  
  accept(requesterId: string) {
    this.friendService.acceptFriendRequest(requesterId).subscribe(() => {
      this.notify.success("Friend request accepted!");
      this.requests = this.requests.filter(r => r.requesterId !== requesterId);
      this.notificationState.decrementFriendRequestCount();
    });
  }

  decline(requesterId: string) {
    this.friendService.declineFriendRequest(requesterId).subscribe(() => {
      this.notify.info("Request declined.");
      this.requests = this.requests.filter(r => r.requesterId !== requesterId);
      this.notificationState.decrementFriendRequestCount(); 
    });
  }
 }

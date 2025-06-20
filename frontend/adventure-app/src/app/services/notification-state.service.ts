import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FriendService } from './friend.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationStateService {
  private friendRequestCountSubject = new BehaviorSubject<number>(0);
  public friendRequestCount$ = this.friendRequestCountSubject.asObservable();

  constructor(private friendService: FriendService) {
    
  }
   public get currentFriendRequestCount(): number {
    return this.friendRequestCountSubject.value;
  }

    fetchFriendRequestCount(): void {
    this.friendService.getIncomingRequestCount().subscribe(count => {
      this.friendRequestCountSubject.next(count);
    });
  }

  setFriendRequestCount(count: number): void {
    this.friendRequestCountSubject.next(count);
  }

  decrementFriendRequestCount(): void {
    const currentCount = this.friendRequestCountSubject.value;
    if (currentCount > 0) {
      this.friendRequestCountSubject.next(currentCount - 1);
    }
  }
  
}
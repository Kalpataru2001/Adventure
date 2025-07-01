import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingStateService {
  private newBookingsCountSubject = new BehaviorSubject<number>(0);
  public newBookingsCount$ = this.newBookingsCountSubject.asObservable();

  constructor() {}

  // Call this when a new challenge is accepted
  incrementNewBookingsCount(): void {
    this.newBookingsCountSubject.next(this.newBookingsCountSubject.value + 1);
  }

  // Call this when the user visits the bookings page
  clearNewBookingsCount(): void {
    this.newBookingsCountSubject.next(0);
  }
}
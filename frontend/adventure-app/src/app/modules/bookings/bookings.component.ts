import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActiveChallenge } from 'src/app/models/booking.model';
import { BookingService } from 'src/app/services/booking.service';
import { NotificationService } from 'src/app/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {
 activeChallenges: ActiveChallenge[] = [];
  isLoading = true;

  constructor(
    private bookingService: BookingService,
    private notify: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getMyActiveChallenges().subscribe(data => {
      this.activeChallenges = data;
      this.isLoading = false;
    });
  }

  async onComplete(challenge: ActiveChallenge): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: `Complete: ${challenge.title}`,
      html: `
      <p class="text-sm text-gray-500 mb-4">${challenge.description}</p>
      <textarea id="swal-post-text" class="swal2-textarea" placeholder="Share your experience... (optional)"></textarea>
      <input id="swal-post-file" type="file" class="swal2-file" accept="image/*,video/*">
    `,
      focusConfirm: false,
      preConfirm: () => {
        const file = (document.getElementById('swal-post-file') as HTMLInputElement).files?.[0];
        if (!file) {
          Swal.showValidationMessage('A photo or video is required to complete the adventure!');
        }
        return {
          text: (document.getElementById('swal-post-text') as HTMLTextAreaElement).value,
          file: file
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Complete & Share'
    });

    if (formValues && formValues.file) {
      // Call the original method to complete the challenge
      this.bookingService.completeChallenge(challenge.completionId, formValues.text || null, formValues.file).subscribe({
        next: () => {
          this.notify.success('Adventure Completed!', 'Congratulations!');
          this.bookingService.updateStreak().subscribe();
          this.activeChallenges = this.activeChallenges.filter(c => c.completionId !== challenge.completionId);
          this.router.navigate(['/social']);
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Failed to complete challenge.');
        }
      });
    }
  }
}

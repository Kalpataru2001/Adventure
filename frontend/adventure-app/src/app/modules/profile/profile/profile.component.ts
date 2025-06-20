import { Component, OnInit } from '@angular/core';
// Import the new service and data model
import { ProfileData, ProfileService } from 'src/app/services/profile.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // This single property will hold all our dynamic data.
  profileData: ProfileData | null = null;
  isLoading = true;
  isUploading = false;

  // The old hardcoded 'badges' and 'stats' arrays are no longer needed.

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.profileService.getProfileData().subscribe(data => {
      if (data) {
        this.profileData = data;
      } else {
        // Handle case where API call fails
        this.notify.error('Could not load your profile. Please try again later.');
      }
      this.isLoading = false;
    });
  }
  loadProfileData(): void {
    this.isLoading = true;
    this.profileService.getProfileData().subscribe(data => {
      if (data) {
        this.profileData = data;
      } else {
        this.notify.error('Could not load your profile data.');
      }
      this.isLoading = false;
    });
  }
  async onEditName(): Promise<void> {
    if (!this.profileData) return;

    const { value: formValues } = await Swal.fire({
      title: 'Edit Your Profile',
      html: `
        <input id="swal-input-firstname" class="swal2-input" placeholder="First Name" value="${this.profileData.firstName}">
        <input id="swal-input-lastname" class="swal2-input" placeholder="Last Name" value="${this.profileData.lastName}">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const firstName = (document.getElementById('swal-input-firstname') as HTMLInputElement).value;
        const lastName = (document.getElementById('swal-input-lastname') as HTMLInputElement).value;
        if (!firstName || !lastName) {
          Swal.showValidationMessage('First and last name are required');
        }
        return { firstName, lastName };
      },
      showCancelButton: true,
      confirmButtonText: 'Save Changes'
    });

    if (formValues) {
      this.profileService.updateProfile(formValues.firstName, formValues.lastName).subscribe({
        next: () => {
          this.notify.success('Profile updated successfully!');
          // Refresh the profile data to show the new name
          this.loadProfileData();
        },
        error: () => {
          this.notify.error('Failed to update profile.');
        }
      });
    }
  }

  async onEditAvatar(): Promise<void> {
    const emojis = ['😀', '😎', '🚀', '🎨', '🍜', '🌍', '🔥', '⭐'];
    const { value: selectedEmoji } = await Swal.fire({
      title: 'Select Your Avatar',
      input: 'radio',
      inputOptions: emojis.reduce((obj, emoji) => ({ ...obj, [emoji]: emoji }), {}),
      inputValidator: (value) => {
        if (!value) {
          return 'You need to choose one!';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Set Avatar'
    });

    if (selectedEmoji) {
      this.profileService.updateAvatar(selectedEmoji).subscribe({
        next: () => {
          this.notify.success('Avatar updated!');
          this.loadProfileData(); // Refresh data to show new avatar
        },
        error: () => this.notify.error('Failed to update avatar.')
      });
    }
  }
  onAvatarClick(fileInput: HTMLInputElement): void {
    fileInput.click();
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return; // No file selected
    }

    const file = input.files[0];

    // Basic validation (optional)
    if (!file.type.startsWith('image/')) {
      this.notify.error('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      this.notify.error('File is too large. Max size is 2MB.');
      return;
    }

    this.isUploading = true;
    this.profileService.uploadAvatar(file).subscribe({
      next: (response) => {
        if (this.profileData) {
          this.profileData.avatarUrl = response.avatarUrl;
        }
        this.notify.success('Avatar updated successfully!');
        this.isUploading = false;
      },
      error: () => {
        this.notify.error('Failed to upload avatar. Please try again.');
        this.isUploading = false;
      }
    });
  }
  onSignOut(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, sign me out!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }
}
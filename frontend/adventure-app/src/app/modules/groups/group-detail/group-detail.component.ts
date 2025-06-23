import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddableFriend, GroupDetail, GroupService } from 'src/app/services/group.service';
import { NotificationService } from 'src/app/services/notification.service'; // Import for error notifications
import Swal from 'sweetalert2';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.scss']
})
export class GroupDetailComponent implements OnInit {
  group: GroupDetail | null = null;
  isLoading = true;
  groupId: string | null = null;
  
  // This property is no longer needed here, as it's fetched inside the method.
  // addableFriends: AddableFriend[] = [];

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private notify: NotificationService // Inject NotificationService
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    if (this.groupId) {
      this.loadGroupDetails();
    }
  }

  loadGroupDetails(): void {
    if (!this.groupId) return;
    this.isLoading = true;
    this.groupService.getGroupDetails(this.groupId).subscribe(data => {
      this.group = data;
      this.isLoading = false;
    });
  }

  // --- THIS IS THE NEW, COMPLETE onAddMembers METHOD ---
  async onAddMembers(): Promise<void> {
    if (!this.groupId) return;

    // First, fetch the list of friends who are eligible to be added.
    this.groupService.getAddableFriends(this.groupId).subscribe(async friends => {

      // If there are no friends to add, show an informative message and stop.
      if (friends.length === 0) {
        Swal.fire('No Friends to Add', 'All of your available friends are already in this group.', 'info');
        return;
      }
      
      // Dynamically create the HTML for the list of friends.
      const friendOptionsHtml = friends.map(friend => 
        // Each friend is a div with a data-userid attribute to store their ID.
        `<div class="friend-option" data-userid="${friend.id}">
           <img src="${friend.avatarUrl || 'assets/default-avatar.png'}" class="friend-avatar">
           <span>${friend.firstName} ${friend.lastName}</span>
         </div>`
      ).join('');

      // Use SweetAlert2 to display our custom HTML.
      const { value: selectedUserId } = await Swal.fire({
        title: 'Add a Friend to the Group',
        html: `
          <input id="swal-search-friends" class="swal2-input" placeholder="Search friends...">
          <div id="swal-friends-list" class="friends-list-container">
            ${friendOptionsHtml}
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Add to Group',
        customClass: {
          container: 'add-friends-modal' // For custom styling
        },
        didOpen: () => {
          // This code runs after the modal opens. We add our event listeners here.
          const friendsList = document.getElementById('swal-friends-list')!;
          const searchInput = document.getElementById('swal-search-friends') as HTMLInputElement;
          let selectedDiv: HTMLElement | null = null;
          
          // Handle clicking on a friend in the list.
          friendsList.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('.friend-option');
            if (target) {
              // Toggle the 'selected' class for visual feedback.
              if (selectedDiv) {
                selectedDiv.classList.remove('selected');
              }
              selectedDiv = target as HTMLElement;
              selectedDiv.classList.add('selected');
            }
          });
          
          // Handle the search functionality.
          searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase();
            const friendDivs = friendsList.querySelectorAll<HTMLElement>('.friend-option');
            friendDivs.forEach(div => {
              const name = div.textContent || '';
              div.style.display = name.toLowerCase().includes(filter) ? '' : 'none';
            });
          });
        },
        preConfirm: () => {
          // This code runs when the user clicks "Add to Group".
          // It finds the selected friend and returns their ID.
          const selectedDiv = document.querySelector('.friend-option.selected');
          if (!selectedDiv) {
            Swal.showValidationMessage('You must select a friend to add');
            return null;
          }
          return selectedDiv.getAttribute('data-userid');
        }
      });

      // If the user selected a friend and clicked "Add to Group"...
      if (selectedUserId) {
        this.groupService.addMember(this.groupId!, selectedUserId).subscribe({
          next: () => {
            Swal.fire('Success!', 'Friend added to the group.', 'success');
            this.loadGroupDetails(); // Refresh the member list to show the new member
          },
          error: (err) => {
            this.notify.error(err.error?.message || "Failed to add friend.");
          }
        });
      }
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddableFriend, GroupDetail, GroupMember, GroupService } from 'src/app/services/group.service';
import { NotificationService } from 'src/app/services/notification.service';
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

  visibleMembers: GroupMember[] = [];
  hiddenMemberCount = 0;
  private readonly maxVisibleMembers = 4; // You can adjust this number

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private notify: NotificationService
  ) { }

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
      this.updateMemberLists();
      this.isLoading = false;
    });
  }

  private updateMemberLists(): void {
    if (this.group?.members) {
      if (this.group.members.length > this.maxVisibleMembers) {
        this.visibleMembers = this.group.members.slice(0, this.maxVisibleMembers);
        this.hiddenMemberCount = this.group.members.length - this.maxVisibleMembers;
      } else {
        this.visibleMembers = this.group.members;
        this.hiddenMemberCount = 0;
      }
    }
  }

  showAllMembers(): void {
    if (!this.group) return;
    const allMembersHtml = this.group.members.map(member =>
      `<div class="friend-option">
         <img src="${member.avatarUrl || 'assets/default-avatar.png'}" class="friend-avatar">
         <span>${member.firstName} ${member.lastName}</span>
       </div>`
    ).join('');
    Swal.fire({
      title: `All Members (${this.group.members.length})`,
      html: `<div class="friends-list-container">${allMembersHtml}</div>`,
      showCloseButton: true,
      showConfirmButton: false
    });
  }

  async onAddMembers(): Promise<void> {
    if (!this.groupId) return;
    this.groupService.getAddableFriends(this.groupId).subscribe(async friends => {
      if (friends.length === 0) {
        Swal.fire('No Friends to Add', 'All of your available friends are already in this group.', 'info');
        return;
      }
      const friendOptionsHtml = friends.map(friend =>
        `<div class="friend-option-multi" data-userid="${friend.id}">
           <img src="${friend.avatarUrl || 'assets/default-avatar.png'}" class="friend-avatar">
           <span>${friend.firstName} ${friend.lastName}</span>
           <input type="checkbox" class="friend-checkbox">
         </div>`
      ).join('');
      const { value: selectedUserIds } = await Swal.fire({
        title: 'Add Friends to the Group',
        html: `<input id="swal-search-friends" class="swal2-input" placeholder="Search friends..."><div id="swal-friends-list" class="friends-list-container">${friendOptionsHtml}</div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Add Selected Friends',
        customClass: { container: 'add-friends-modal' },
        didOpen: () => {
          const friendsList = document.getElementById('swal-friends-list')!;
          const searchInput = document.getElementById('swal-search-friends') as HTMLInputElement;
          friendsList.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('.friend-option-multi');
            if (target) {
              const checkbox = target.querySelector<HTMLInputElement>('.friend-checkbox')!;
              checkbox.checked = !checkbox.checked;
              target.classList.toggle('selected', checkbox.checked);
            }
          });
          searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase();
            friendsList.querySelectorAll<HTMLElement>('.friend-option-multi').forEach(div => {
              const name = div.textContent || '';
              div.style.display = name.toLowerCase().includes(filter) ? '' : 'none';
            });
          });
        },
        preConfirm: () => {
          const selectedIds: string[] = [];
          document.querySelectorAll<HTMLInputElement>('.friend-checkbox:checked').forEach(checkbox => {
            const userId = checkbox.closest('.friend-option-multi')?.getAttribute('data-userid');
            if (userId) selectedIds.push(userId);
          });
          if (selectedIds.length === 0) {
            Swal.showValidationMessage('You must select at least one friend to add');
            return null;
          }
          return selectedIds;
        }
      });
      if (selectedUserIds && selectedUserIds.length > 0) {
        this.groupService.addMembers(this.groupId!, selectedUserIds).subscribe({
          next: () => {
            Swal.fire('Success!', `${selectedUserIds.length} friend(s) added to the group.`, 'success');
            this.loadGroupDetails();
          },
          error: (err) => {
            this.notify.error(err.error?.message || "Failed to add friends.");
          }
        });
      }
    });
  }
}
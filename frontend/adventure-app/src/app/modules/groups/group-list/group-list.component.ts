import { Component, OnInit } from '@angular/core';
import { GroupListItem, GroupService } from 'src/app/services/group.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit{
  groups: GroupListItem[] = [];
  isLoading = true;

  constructor(private groupService: GroupService) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading = true;
    this.groupService.getMyGroups().subscribe(data => {
      this.groups = data;
      this.isLoading = false;
    });
  }

  async onCreateGroup(): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Create a New Adventure Group',
      html: `
        <input id="swal-group-name" class="swal2-input" placeholder="Group Name">
        <textarea id="swal-group-desc" class="swal2-textarea" placeholder="Group description... (optional)"></textarea>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('swal-group-name') as HTMLInputElement).value;
        if (!name) { Swal.showValidationMessage('Group name is required'); }
        return {
          name: name,
          description: (document.getElementById('swal-group-desc') as HTMLTextAreaElement).value
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Create Group'
    });

    if (formValues) {
      this.groupService.createGroup(formValues.name, formValues.description || null).subscribe(() => {
        Swal.fire('Success!', 'Your new group has been created.', 'success');
        this.loadGroups(); // Refresh the list
      });
    }
  }
}

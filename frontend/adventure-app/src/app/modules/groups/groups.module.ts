import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupsRoutingModule } from './groups-routing.module';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupCreateComponent } from './group-create/group-create.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupDetailComponent } from './group-detail/group-detail.component';


@NgModule({
  declarations: [
    GroupListComponent,
    GroupCreateComponent,
    GroupsComponent,
    GroupDetailComponent
  ],
  imports: [
    CommonModule,
    GroupsRoutingModule
  ]
})
export class GroupsModule { }

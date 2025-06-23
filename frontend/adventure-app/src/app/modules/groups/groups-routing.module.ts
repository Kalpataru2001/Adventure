import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupDetailComponent } from './group-detail/group-detail.component';

const routes: Routes = [
  {
    path: '',
    component: GroupsComponent, // <-- Use GroupsComponent as the main shell
    children: [
      { path: '', component: GroupListComponent },
       { path: ':groupId', component: GroupDetailComponent } // <-- The default child route is the list
      // Later you can add: { path: ':groupId', component: GroupDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupsRoutingModule { }

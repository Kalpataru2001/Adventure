import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FindFriendsComponent } from './find-friends/find-friends.component';
import { FriendRequestsComponent } from './friend-requests/friend-requests.component';

const routes: Routes = [
   { path: 'find', component: FindFriendsComponent },
  { path: 'requests', component: FriendRequestsComponent },
  { path: '', redirectTo: 'requests', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FriendsRoutingModule { }

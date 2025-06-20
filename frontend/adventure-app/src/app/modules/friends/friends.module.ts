import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FriendsRoutingModule } from './friends-routing.module';
import { FindFriendsComponent } from './find-friends/find-friends.component';
import { FriendRequestsComponent } from './friend-requests/friend-requests.component';


@NgModule({
  declarations: [
    FindFriendsComponent,
    FriendRequestsComponent
  ],
  imports: [
    CommonModule,
    FriendsRoutingModule
  ]
})
export class FriendsModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './modules/auth/guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./modules/home/home.module').then(m => m.HomeModule)
      },
      {
        path: 'destinations',
        loadChildren: () =>
          import('./modules/destinations/destinations.module').then(m => m.DestinationsModule)
      },
      {
        path: 'bookings',
        loadChildren: () =>
          import('./modules/bookings/bookings.module').then(m => m.BookingsModule)
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./modules/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'social',
        loadChildren: () =>
          import('./modules/social/social.module').then(m => m.SocialModule)
      },
      {
        path: 'friends',
        loadChildren: () =>
          import('./modules/friends/friends.module').then(m => m.FriendsModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'groups',
        loadChildren: () => import('./modules/groups/groups.module').then(m => m.GroupsModule),
        canActivate: [AuthGuard] // Protect this section
      },
    ]
  },

  // Catch‑all redirect
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
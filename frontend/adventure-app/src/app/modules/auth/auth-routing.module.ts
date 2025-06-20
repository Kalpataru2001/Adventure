// src/app/modules/auth/auth-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Your existing imports are correct
import { AuthComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { LoginGuard } from './guards/login.guard';

// --- 1. Import your two new components ---
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { 
    path: '',
    component: AuthComponent, // This correctly wraps all auth pages in your layout
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [LoginGuard] },
      
      // --- 2. The new routes are added here, inside the children array ---
      { 
        path: 'forgot-password', 
        component: ForgotPasswordComponent, 
        canActivate: [LoginGuard] 
      },
      { 
        // Note: The path for the OTP flow is simpler, no ':token' is needed
        path: 'reset-password', 
        component: ResetPasswordComponent, 
        canActivate: [LoginGuard] 
      }
    ] 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
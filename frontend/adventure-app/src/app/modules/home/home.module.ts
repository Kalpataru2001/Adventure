import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule

@NgModule({
  declarations: [
    HomeComponent // Only components, directives, and pipes go here
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    MatCardModule // Add MatCardModule to imports
  ]
})
export class HomeModule { }
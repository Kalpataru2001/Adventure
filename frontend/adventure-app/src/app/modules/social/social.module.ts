import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MomentModule } from 'ngx-moment';
import { SocialRoutingModule } from './social-routing.module';
import { SocialComponent } from './social.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    SocialComponent
  ],
  imports: [
    CommonModule,
    SocialRoutingModule,
    MomentModule,
    FormsModule
  ]
})
export class SocialModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserMangmentRoutingModule } from './user-mangment-routing-module';
import { RouterOutlet } from '@angular/router';
import { Layout } from './layout/layout';
import { UserHeader } from './layout/user-header/user-header';
import { UserFooter } from './layout/user-footer/user-footer';


@NgModule({
  declarations: [
    Layout    
  ],
  imports: [
    CommonModule,
    UserMangmentRoutingModule,
    UserHeader,
    UserFooter
  ],
}) 
export class UserMangmentModule {}

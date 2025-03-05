import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BillsRoutingModule } from './bills-routing.module';
import { BillListComponent } from './components/bill-list/bill-list.component';
import { BillFormComponent } from './components/bill-form/bill-form.component';
import { BillDashboardComponent } from './components/bill-dashboard/bill-dashboard.component';

@NgModule({
  declarations: [
    BillListComponent,
    BillFormComponent,
    BillDashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    BillsRoutingModule
  ]
})
export class BillsModule { }
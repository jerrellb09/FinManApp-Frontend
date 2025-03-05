import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillListComponent } from './components/bill-list/bill-list.component';
import { BillFormComponent } from './components/bill-form/bill-form.component';
import { BillDashboardComponent } from './components/bill-dashboard/bill-dashboard.component';

const routes: Routes = [
  { path: '', component: BillDashboardComponent },
  { path: 'list', component: BillListComponent },
  { path: 'add', component: BillFormComponent },
  { path: 'edit/:id', component: BillFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillsRoutingModule { }
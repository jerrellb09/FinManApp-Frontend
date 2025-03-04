import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BudgetListComponent } from './components/budget-list/budget-list.component';
import { BudgetFormComponent } from './components/budget-form/budget-form.component';

const routes: Routes = [
  { path: '', component: BudgetListComponent },
  { path: 'add', component: BudgetFormComponent },
  { path: 'edit/:id', component: BudgetFormComponent }
];

@NgModule({
  declarations: [
    BudgetListComponent,
    BudgetFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class BudgetsModule { }
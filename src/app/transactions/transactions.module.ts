import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TransactionListComponent } from './components/transaction-list/transaction-list.component';

const routes: Routes = [
  { path: '', component: TransactionListComponent }
];

@NgModule({
  declarations: [
    TransactionListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class TransactionsModule { }
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AccountListComponent } from './components/account-list/account-list.component';
import { AccountFormComponent } from './components/account-form/account-form.component';

const routes: Routes = [
  { path: '', component: AccountListComponent },
  { path: 'add', component: AccountFormComponent },
  { path: 'edit/:id', component: AccountFormComponent }
];

@NgModule({
  declarations: [
    AccountListComponent,
    AccountFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AccountsModule { }
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'accounts',
    loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions',
    loadChildren: () => import('./transactions/transactions.module').then(m => m.TransactionsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'budgets',
    loadChildren: () => import('./budgets/budgets.module').then(m => m.BudgetsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'bills',
    loadChildren: () => import('./bills/bills.module').then(m => m.BillsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'insights',
    loadChildren: () => import('./insights/insights.module').then(m => m.InsightsModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Chart.js related imports
import { registerables, Chart } from 'chart.js';

// AI Insights Components
import { AIInsightsComponent } from './components/ai-insights/ai-insights.component';
import { AIFinancialInsightsComponent } from './components/ai-financial-insights/ai-financial-insights.component';
import { AIBudgetSuggestionsComponent } from './components/ai-budget-suggestions/ai-budget-suggestions.component';
import { AISpendingHabitsComponent } from './components/ai-spending-habits/ai-spending-habits.component';

const routes: Routes = [
  { path: '', redirectTo: 'ai', pathMatch: 'full' },
  { path: 'ai', component: AIInsightsComponent },
  { path: 'ai-financial-insights', component: AIFinancialInsightsComponent },
  { path: 'ai-budget-suggestions', component: AIBudgetSuggestionsComponent },
  { path: 'ai-spending-habits', component: AISpendingHabitsComponent }
];

@NgModule({
  declarations: [
    AIInsightsComponent,
    AIFinancialInsightsComponent,
    AIBudgetSuggestionsComponent,
    AISpendingHabitsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class InsightsModule { 
  constructor() {
    // Register all Chart.js components
    Chart.register(...registerables);
  }
}
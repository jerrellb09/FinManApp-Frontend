import { Component, OnInit } from '@angular/core';
import { BudgetService } from '../../../services/budget.service';
import { Budget } from '../../../models/budget.model';

@Component({
  selector: 'app-budget-list',
  templateUrl: './budget-list.component.html',
  styleUrls: ['./budget-list.component.scss']
})
export class BudgetListComponent implements OnInit {
  budgets: Budget[] = [];
  loading = true;
  error = '';
  
  constructor(private budgetService: BudgetService) { }
  
  ngOnInit(): void {
    this.loadBudgets();
  }
  
  loadBudgets(): void {
    this.loading = true;
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        this.budgets = budgets;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load budgets. Please try again later.';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  deleteBudget(id: number): void {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.deleteBudget(id).subscribe({
        next: () => {
          this.budgets = this.budgets.filter(budget => budget.id !== id);
        },
        error: (err) => {
          this.error = 'Failed to delete budget. Please try again.';
          console.error(err);
        }
      });
    }
  }
  
  getBudgetProgress(budget: Budget): number {
    const spending = budget.currentSpending || 0;
    return (spending / budget.amount) * 100;
  }
  
  getProgressBarClass(percentage: number): string {
    if (percentage >= 100) return 'bg-danger';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  }
  
  getRemainingAmount(budget: Budget): number {
    const spending = budget.currentSpending || 0;
    return Math.max(budget.amount - spending, 0);
  }
  
  getDateRangeLabel(budget: Budget): string {
    const startDate = new Date(budget.startDate);
    
    if (!budget.endDate) {
      return `${startDate.toLocaleDateString()} - Ongoing`;
    }
    
    const endDate = new Date(budget.endDate);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
  
  isActive(budget: Budget): boolean {
    const today = new Date();
    const startDate = new Date(budget.startDate);
    
    if (!budget.endDate) {
      return today >= startDate; // If no end date, budget is active if started
    }
    
    const endDate = new Date(budget.endDate);
    return today >= startDate && today <= endDate;
  }
}
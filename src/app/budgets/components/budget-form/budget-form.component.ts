import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BudgetService } from '../../../services/budget.service';
import { CategoryService } from '../../../services/category.service';
import { Budget } from '../../../models/budget.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-budget-form',
  templateUrl: './budget-form.component.html',
  styleUrls: ['./budget-form.component.scss']
})
export class BudgetFormComponent implements OnInit {
  budgetForm!: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  categories: Category[] = [];
  isEditMode = false;
  budgetId: number | null = null;
  
  constructor(
    private formBuilder: FormBuilder,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
  
  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.budgetId = +id;
      this.loadBudget(this.budgetId);
    }
  }
  
  initForm(): void {
    this.budgetForm = this.formBuilder.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      endDate: [this.getNextMonthDate(), Validators.required],
      description: ['']
    });
  }
  
  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load categories. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  loadBudget(id: number): void {
    this.loading = true;
    this.budgetService.getBudgetById(id).subscribe({
      next: (budget) => {
        this.budgetForm.patchValue({
          name: budget.name,
          amount: budget.amount,
          categoryId: budget.categoryId,
          startDate: new Date(budget.startDate).toISOString().split('T')[0],
          endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : '',
          description: budget.description
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load budget. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  onSubmit(): void {
    if (this.budgetForm.invalid) {
      return;
    }
    
    this.submitting = true;
    this.error = '';
    this.success = '';
    
    const budget: Budget = this.budgetForm.value;
    
    if (this.isEditMode && this.budgetId) {
      // Update existing budget
      this.budgetService.updateBudget(this.budgetId, budget).subscribe({
        next: () => {
          this.submitting = false;
          this.success = 'Budget updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/budgets']);
          }, 1500);
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.message || 'Failed to update budget. Please try again.';
        }
      });
    } else {
      // Create new budget
      this.budgetService.createBudget(budget).subscribe({
        next: () => {
          this.submitting = false;
          this.success = 'Budget created successfully!';
          setTimeout(() => {
            this.router.navigate(['/budgets']);
          }, 1500);
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.message || 'Failed to create budget. Please try again.';
        }
      });
    }
  }
  
  getNextMonthDate(): string {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return nextMonth.toISOString().split('T')[0];
  }
}
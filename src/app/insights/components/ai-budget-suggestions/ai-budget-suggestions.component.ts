import { Component, OnInit } from '@angular/core';
import { InsightService } from '../../../services/insight.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-ai-budget-suggestions',
  templateUrl: './ai-budget-suggestions.component.html',
  styleUrls: ['./ai-budget-suggestions.component.scss']
})
export class AIBudgetSuggestionsComponent implements OnInit {
  suggestions: string = '';
  loading: boolean = false;
  error: string | null = null;
  parsedSuggestions: any[] = [];

  constructor(private insightService: InsightService) { }

  ngOnInit(): void {
    this.getBudgetSuggestions();
  }

  getBudgetSuggestions(): void {
    this.loading = true;
    this.error = null;
    
    this.insightService.getAIBudgetSuggestions()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.suggestions = data.suggestions;
          this.parseSuggestions();
        },
        error: (err) => {
          console.error('Error fetching AI budget suggestions', err);
          this.error = 'Unable to load budget suggestions. Please try again later.';
        }
      });
  }

  parseSuggestions(): void {
    // This is a simplified parsing method - in a real app, you'd have more robust parsing
    const lines = this.suggestions.split('\n');
    this.parsedSuggestions = [];
    
    let currentCategory = '';
    let currentAmount = '';
    let currentDescription = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Try to extract "Category: $Amount" pattern
      const match = trimmedLine.match(/^([^:]+):\s*\$?(\d+(?:\.\d{1,2})?)(.*)$/);
      
      if (match) {
        // If we have a previous category saved, push it before starting a new one
        if (currentCategory && currentAmount) {
          this.parsedSuggestions.push({
            category: currentCategory,
            amount: parseFloat(currentAmount),
            description: currentDescription.trim()
          });
        }
        
        // Start new category
        currentCategory = match[1].trim();
        currentAmount = match[2].trim();
        currentDescription = match[3] || '';
      } else if (currentCategory && currentAmount) {
        // This line is likely a continuation of the description
        currentDescription += ' ' + trimmedLine;
      }
    }
    
    // Add the last category if there's one being processed
    if (currentCategory && currentAmount) {
      this.parsedSuggestions.push({
        category: currentCategory,
        amount: parseFloat(currentAmount),
        description: currentDescription.trim()
      });
    }
  }

  refreshSuggestions(): void {
    this.getBudgetSuggestions();
  }

  // Helper function to get random colors for budget categories
  getCategoryColor(index: number): string {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];
    return colors[index % colors.length];
  }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ai-insights',
  templateUrl: './ai-insights.component.html',
  styleUrls: ['./ai-insights.component.scss']
})
export class AIInsightsComponent implements OnInit {
  aiFeatures = [
    {
      id: 'financial-insights',
      title: 'Financial Insights',
      description: 'Get personalized financial insights based on your spending habits and transaction history.',
      icon: 'bi-lightbulb',
      color: 'primary',
      route: '/insights/ai-financial-insights'
    },
    {
      id: 'budget-suggestions',
      title: 'AI Budget Suggestions',
      description: 'Let AI analyze your spending patterns and recommend optimal budget allocations.',
      icon: 'bi-wallet2',
      color: 'success',
      route: '/insights/ai-budget-suggestions'
    },
    {
      id: 'spending-habits',
      title: 'Spending Habits Analysis',
      description: 'Visualize your spending habits with AI-generated charts and detailed analysis.',
      icon: 'bi-graph-up',
      color: 'info',
      route: '/insights/ai-spending-habits'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void { }

  navigateToFeature(route: string): void {
    this.router.navigate([route]);
  }
}
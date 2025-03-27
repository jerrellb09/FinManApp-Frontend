import { Component, OnInit } from '@angular/core';
import { InsightService } from '../../../services/insight.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-ai-financial-insights',
  templateUrl: './ai-financial-insights.component.html',
  styleUrls: ['./ai-financial-insights.component.scss']
})
export class AIFinancialInsightsComponent implements OnInit {
  insights: string = '';
  loading: boolean = false;
  error: string | null = null;
  insightParagraphs: string[] = [];

  constructor(private insightService: InsightService) { }

  ngOnInit(): void {
    this.getFinancialInsights();
  }

  getFinancialInsights(): void {
    this.loading = true;
    this.error = null;
    
    this.insightService.getAIFinancialInsights()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.insights = data.insights;
          this.insightParagraphs = this.insights.split('\n\n').filter(p => p.trim() !== '');
        },
        error: (err) => {
          console.error('Error fetching AI financial insights', err);
          this.error = 'Unable to load AI insights. Please try again later.';
        }
      });
  }

  refreshInsights(): void {
    this.getFinancialInsights();
  }
}
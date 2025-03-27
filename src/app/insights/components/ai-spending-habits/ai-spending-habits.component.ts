import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { InsightService } from '../../../services/insight.service';
import { finalize } from 'rxjs/operators';
import { Chart } from 'chart.js/auto';

// Import for template usage
declare global {
  interface Window {
    Object: ObjectConstructor
  }
}

@Component({
  selector: 'app-ai-spending-habits',
  templateUrl: './ai-spending-habits.component.html',
  styleUrls: ['./ai-spending-habits.component.scss']
})
export class AISpendingHabitsComponent implements OnInit, AfterViewInit {
  // Add Object constructor for template usage
  Object = Object;
  @ViewChild('chart1') chart1Canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart2') chart2Canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart3') chart3Canvas!: ElementRef<HTMLCanvasElement>;

  analysis: string = '';
  chartSuggestions: { [key: string]: string } = {};
  loading: boolean = false;
  error: string | null = null;
  charts: Chart[] = [];

  constructor(private insightService: InsightService) { }

  ngOnInit(): void {
    this.getSpendingHabitsAnalysis();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  getSpendingHabitsAnalysis(): void {
    this.loading = true;
    this.error = null;
    
    this.insightService.getAISpendingHabits()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.analysis = data.analysis;
          this.chartSuggestions = data.chartSuggestions || {};
          
          // Give time for view to update and canvas elements to be available
          setTimeout(() => {
            this.initializeCharts();
          }, 100);
        },
        error: (err) => {
          console.error('Error fetching AI spending habits analysis', err);
          this.error = 'Unable to load spending habits analysis. Please try again later.';
        }
      });
  }

  initializeCharts(): void {
    // Destroy existing charts if any
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
    
    // Create sample charts based on AI suggestions
    // In a real implementation, you'd parse the AI suggestions to create appropriate charts
    if (this.chart1Canvas) {
      const ctx1 = this.chart1Canvas.nativeElement.getContext('2d');
      if (ctx1) {
        this.charts.push(this.createDoughnutChart(ctx1, 'Category Breakdown'));
      }
    }
    
    if (this.chart2Canvas) {
      const ctx2 = this.chart2Canvas.nativeElement.getContext('2d');
      if (ctx2) {
        this.charts.push(this.createLineChart(ctx2, 'Weekly Spending Pattern'));
      }
    }
    
    if (this.chart3Canvas) {
      const ctx3 = this.chart3Canvas.nativeElement.getContext('2d');
      if (ctx3) {
        this.charts.push(this.createBarChart(ctx3, 'Top Spending Categories'));
      }
    }
  }

  createDoughnutChart(ctx: CanvasRenderingContext2D, label: string): Chart {
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Dining', 'Groceries', 'Entertainment', 'Transportation', 'Bills', 'Others'],
        datasets: [{
          data: [25, 30, 15, 10, 15, 5],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: label
          }
        }
      }
    });
  }

  createLineChart(ctx: CanvasRenderingContext2D, label: string): Chart {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Daily Spending',
          data: [65, 59, 80, 81, 56, 155, 140],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: label
          }
        }
      }
    });
  }

  createBarChart(ctx: CanvasRenderingContext2D, label: string): Chart {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Restaurants', 'Groceries', 'Amazon', 'Entertainment', 'Gas'],
        datasets: [{
          label: 'Spending Amount ($)',
          data: [120, 190, 130, 90, 70],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: label
          }
        }
      }
    });
  }

  refreshAnalysis(): void {
    this.getSpendingHabitsAnalysis();
  }
}
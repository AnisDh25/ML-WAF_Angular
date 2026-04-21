import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-ml-monitor',
  imports: [CommonModule],
  templateUrl: './ml-monitor.html',
  styleUrl: './ml-monitor.scss',
})
export class MlMonitor implements OnInit, OnDestroy {
  modelStats: any = null;
  predictions: any[] = [];
  isLoading = true;
  
  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 20000; // 20 seconds for ML stats
  lastSyncTime: Date | null = null;
  isSyncing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadModelStats();
    this.loadPredictions();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadModelStats(): void {
    // Placeholder for ML model statistics
    this.modelStats = {
      accuracy: 94.5,
      precision: 92.3,
      recall: 89.7,
      f1Score: 91.0,
      totalPredictions: 15420,
      modelVersion: 'v2.1.0',
      lastTrained: '2024-01-15'
    };
  }

  loadPredictions(): void {
    // Placeholder for recent predictions
    this.predictions = [
      { timestamp: '2024-01-20T10:30:00Z', input: 'SELECT * FROM users', prediction: 'SQL Injection', confidence: 0.95 },
      { timestamp: '2024-01-20T10:29:00Z', input: '/admin/login', prediction: 'Legitimate', confidence: 0.12 },
      { timestamp: '2024-01-20T10:28:00Z', input: '<script>alert("xss")</script>', prediction: 'XSS', confidence: 0.98 },
      { timestamp: '2024-01-20T10:27:00Z', input: '/api/users?page=1', prediction: 'Legitimate', confidence: 0.08 }
    ];
    this.isLoading = false;
  }

  // Helper methods for badge styling
  getPredictionBadgeClass(prediction: string): string {
    switch (prediction.toLowerCase()) {
      case 'legitimate': return 'success';
      case 'sql injection': return 'danger';
      case 'xss': return 'danger';
      case 'path traversal': return 'warning';
      default: return 'secondary';
    }
  }

  getConfidenceBadgeClass(confidence: number): string {
    if (confidence > 0.8) return 'success';
    if (confidence > 0.6) return 'warning';
    return 'danger';
  }

  // Real-time synchronization methods
  startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadModelStats();
      this.loadPredictions();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Manual refresh method
  refreshMLData(): void {
    this.isSyncing = true;
    this.loadModelStats();
    this.loadPredictions();
    this.lastSyncTime = new Date();
    this.isSyncing = false;
  }

  // Format last sync time for display
  getSyncStatusText(): string {
    if (!this.lastSyncTime) {
      return 'Never synced';
    }
    
    const now = new Date();
    const diff = now.getTime() - this.lastSyncTime.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
  }
}

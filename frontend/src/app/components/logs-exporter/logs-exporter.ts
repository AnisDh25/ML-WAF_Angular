import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-logs-exporter',
  imports: [CommonModule, FormsModule],
  templateUrl: './logs-exporter.html',
  styleUrl: './logs-exporter.scss',
})
export class LogsExporter implements OnInit, OnDestroy {
  logs: any[] = [];
  filteredLogs: any[] = [];
  isLoading = true;
  
  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 15000; // 15 seconds for logs
  lastSyncTime: Date | null = null;
  isSyncing = false;
  
  // Filter options
  dateFrom: string = '';
  dateTo: string = '';
  ipAddress: string = '';
  decision: string = 'all';
  method: string = 'all';
  
  // Export options
  exportFormat: string = 'csv';
  maxRecords: number = 1000;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadLogs();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadLogs(): void {
    this.isSyncing = true;
    this.apiService.getLogs(this.maxRecords).subscribe({
      next: (response) => {
        this.logs = response.logs;
        this.filteredLogs = [...this.logs];
        this.applyFilters();
        this.lastSyncTime = new Date();
        this.isSyncing = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.isSyncing = false;
        this.isLoading = false;
      }
    });
  }

  // Real-time synchronization methods
  startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadLogs();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Manual refresh method
  refreshLogs(): void {
    this.loadLogs();
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

  applyFilters(): void {
    this.filteredLogs = this.logs.filter(log => {
      let matches = true;
      
      if (this.dateFrom && new Date(log.timestamp) < new Date(this.dateFrom)) {
        matches = false;
      }
      
      if (this.dateTo && new Date(log.timestamp) > new Date(this.dateTo)) {
        matches = false;
      }
      
      if (this.ipAddress && !log.ip.includes(this.ipAddress)) {
        matches = false;
      }
      
      if (this.decision !== 'all' && log.decision !== this.decision) {
        matches = false;
      }
      
      if (this.method !== 'all' && log.method !== this.method) {
        matches = false;
      }
      
      return matches;
    });
  }

  clearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.ipAddress = '';
    this.decision = 'all';
    this.method = 'all';
    this.filteredLogs = [...this.logs];
  }

  exportLogs(): void {
    const data = this.filteredLogs.slice(0, this.maxRecords);
    
    if (this.exportFormat === 'csv') {
      this.exportToCsv(data);
    } else if (this.exportFormat === 'json') {
      this.exportToJson(data);
    }
  }

  private exportToCsv(data: any[]): void {
    const headers = ['Timestamp', 'IP Address', 'Method', 'URL', 'Decision', 'Risk Score', 'Reason'];
    const csvContent = [
      headers.join(','),
      ...data.map(log => [
        log.timestamp,
        log.ip,
        log.method,
        log.url,
        log.decision,
        log.ml_score || '',
        log.reason || ''
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'waf-logs.csv', 'text/csv');
  }

  private exportToJson(data: any[]): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, 'waf-logs.json', 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Helper methods for badge styling
  getMethodBadgeClass(method: string): string {
    switch (method) {
      case 'GET': return 'secondary';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  }

  getDecisionBadgeClass(decision: string): string {
    switch (decision.toLowerCase()) {
      case 'allowed': return 'success';
      case 'blocked': return 'danger';
      default: return 'secondary';
    }
  }

  getRiskBadgeClass(score: number): string {
    if (score < 0.3) return 'success';
    if (score < 0.6) return 'warning';
    if (score < 0.8) return 'danger';
    return 'danger';
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { ApiService, Stats, LogEntry, Alert, SystemStatus } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  stats: Stats | null = null;
  recentLogs: LogEntry[] = [];
  recentAlerts: Alert[] = [];
  systemStatus: SystemStatus | null = null;
  currentTime = new Date().toLocaleTimeString();
  
  trafficChart: Chart | null = null;
  attacksChart: Chart | null = null;
  
  isLoading = true;
  errorMessage = '';
  
  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private timeSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 5000; // 5 seconds for dashboard
  private readonly TIME_INTERVAL = 1000; // 1 second for time
  lastSyncTime: Date | null = null;
  isSyncing = false;
  
  private refreshInterval: any;
  private previousStats: Stats | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeCharts();
    this.loadDashboardData();
    this.loadChartData();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.trafficChart) {
      this.trafficChart.destroy();
    }
    if (this.attacksChart) {
      this.attacksChart.destroy();
    }
  }

  loadDashboardData(): void {
    this.isSyncing = true;
    
    // Load all data in parallel
    this.apiService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.updateStatsDisplay(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.errorMessage = 'Failed to load statistics';
        // Use fallback mock data
        this.stats = this.getMockStats();
        if (this.stats) {
          this.updateStatsDisplay(this.stats);
        }
      }
    });

    this.apiService.getLogs(10).subscribe({
      next: (response) => {
        this.recentLogs = response.logs;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        // Use fallback mock data
        this.recentLogs = this.getMockLogs();
      }
    });

    this.apiService.getAlerts(5).subscribe({
      next: (response) => {
        this.recentAlerts = response.alerts;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        // Use fallback mock data
        this.recentAlerts = this.getMockAlerts();
      }
    });

    this.apiService.getSystemStatus().subscribe({
      next: (status) => {
        this.systemStatus = status;
      },
      error: (error) => {
        console.error('Error loading system status:', error);
        // Use fallback mock data
        this.systemStatus = this.getMockSystemStatus();
      }
    });

    this.lastSyncTime = new Date();
    this.isSyncing = false;
    this.isLoading = false;
  }

  // Real-time synchronization methods
  startPolling(): void {
    // Start polling for dashboard data
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadDashboardData();
    });
    
    // Start time updates
    this.timeSubscription = interval(this.TIME_INTERVAL).subscribe(() => {
      this.updateCurrentTime();
    });
  }

  stopPolling(): void {
    // Stop polling when component is destroyed
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
      this.timeSubscription = null;
    }
  }

  // Manual refresh method
  refreshDashboard(): void {
    this.loadDashboardData();
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

  loadChartData(): void {
    this.apiService.getTrafficChart().subscribe({
      next: (data) => {
        this.updateTrafficChart(data);
      },
      error: (error) => {
        console.error('Error loading traffic chart:', error);
        // Use fallback mock data
        this.updateTrafficChart(this.getMockTrafficData());
      }
    });

    this.apiService.getAttacksChart().subscribe({
      next: (data) => {
        this.updateAttacksChart(data);
      },
      error: (error) => {
        console.error('Error loading attacks chart:', error);
        // Use fallback mock data
        this.updateAttacksChart(this.getMockAttacksData());
      }
    });
  }

  initializeCharts(): void {
    // Initialize traffic chart
    const trafficCtx = document.getElementById('trafficChart') as HTMLCanvasElement;
    if (trafficCtx) {
      const trafficConfig: ChartConfiguration = {
        type: 'line' as ChartType,
        data: {
          labels: [],
          datasets: [{
            label: 'Traffic',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };
      this.trafficChart = new Chart(trafficCtx, trafficConfig);
    }

    // Initialize attacks chart
    const attacksCtx = document.getElementById('attacksChart') as HTMLCanvasElement;
    if (attacksCtx) {
      const attacksConfig: ChartConfiguration = {
        type: 'doughnut' as ChartType,
        data: {
          labels: [],
          datasets: [{
            label: 'Attack Types',
            data: [],
            backgroundColor: [
              '#e74c3c',
              '#f39c12',
              '#27ae60',
              '#3498db',
              '#9b59b6'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            }
          }
        }
      };
      this.attacksChart = new Chart(attacksCtx, attacksConfig);
    }
  }

  updateTrafficChart(data: any): void {
    if (this.trafficChart) {
      this.trafficChart.data.labels = data.labels;
      this.trafficChart.data.datasets[0].data = data.datasets[0].data;
      this.trafficChart.update();
    }
  }

  updateAttacksChart(data: any): void {
    if (this.attacksChart) {
      this.attacksChart.data.labels = data.labels;
      this.attacksChart.data.datasets[0].data = data.datasets[0].data;
      this.attacksChart.update();
    }
  }

  updateStatsDisplay(stats: Stats): void {
    // Animate number changes
    if (this.previousStats) {
      this.animateNumber('totalRequests', this.previousStats.total_requests, stats.total_requests);
      this.animateNumber('blockedRequests', this.previousStats.blocked_requests, stats.blocked_requests);
      this.animateNumber('highRiskRequests', this.previousStats.high_risk_requests, stats.high_risk_requests);
      this.animateNumber('blockRate', this.previousStats.block_rate, stats.block_rate);
    }

    // Update change indicators
    this.updateChangeIndicator('totalRequestsChange', stats.total_requests, this.previousStats?.total_requests);
    this.updateChangeIndicator('blockedRequestsChange', stats.blocked_requests, this.previousStats?.blocked_requests);
    this.updateChangeIndicator('highRiskRequestsChange', stats.high_risk_requests, this.previousStats?.high_risk_requests);
    this.updateChangeIndicator('blockRateChange', stats.block_rate, this.previousStats?.block_rate);

    this.previousStats = { ...stats };
  }

  animateNumber(elementId: string, start: number, end: number): void {
    const element = document.getElementById(elementId);
    if (element) {
      const duration = 1000;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }

  updateChangeIndicator(elementId: string, current: number, previous?: number): void {
    const element = document.getElementById(elementId);
    if (element && previous !== undefined) {
      const change = current - previous;
      const percentage = previous > 0 ? (change / previous) * 100 : 0;
      
      element.className = percentage > 0 ? 'text-danger' : percentage < 0 ? 'text-success' : 'text-muted';
      element.textContent = percentage > 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
    }
  }

  blockIp(ip: string): void {
    if (confirm(`Are you sure you want to block IP ${ip}?`)) {
      // Placeholder for IP blocking functionality
      console.log(`Blocking IP: ${ip}`);
      alert(`IP ${ip} has been blocked (placeholder)`);
      // In a real implementation, this would call the API service
    }
  }

  updateCurrentTime(): void {
    this.currentTime = new Date().toLocaleTimeString();
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  // Helper methods for template access
  getProxyStatus(): string {
    return this.systemStatus?.proxy?.status || 'offline';
  }

  getTopBlockedIpsLength(): number {
    return this.stats?.top_blocked_ips?.length || 0;
  }

  // Helper methods for activity display
  getActivityIcon(decision: string): string {
    switch (decision?.toLowerCase()) {
      case 'blocked': return 'ban';
      case 'allowed': return 'check';
      default: return 'question';
    }
  }

  getActivityColor(decision: string): string {
    switch (decision?.toLowerCase()) {
      case 'blocked': return 'danger';
      case 'allowed': return 'success';
      default: return 'secondary';
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  // Mock data methods for fallback when API calls fail
  getMockStats(): Stats {
    return {
      total_requests: 12543,
      blocked_requests: 3421,
      high_risk_requests: 892,
      block_rate: 27.3,
      top_blocked_ips: [
        { ip: '192.168.1.100', count: 45 },
        { ip: '10.0.0.50', count: 32 },
        { ip: '172.16.0.25', count: 28 },
        { ip: '203.0.113.1', count: 19 },
        { ip: '198.51.100.10', count: 15 }
      ]
    };
  }

  getMockLogs(): LogEntry[] {
    return [
      {
        id: 1,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ip: '192.168.1.100',
        method: 'POST',
        url: '/api/login',
        decision: 'blocked',
        risk_score: 0.85
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        ip: '10.0.0.50',
        method: 'GET',
        url: '/api/users',
        decision: 'allowed',
        risk_score: 0.15
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        ip: '172.16.0.25',
        method: 'POST',
        url: '/api/admin',
        decision: 'blocked',
        risk_score: 0.92
      }
    ];
  }

  getMockAlerts(): Alert[] {
    return [
      {
        id: 1,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'SQL Injection',
        message: 'SQL injection attempt detected on /api/login',
        severity: 'high',
        ip: '192.168.1.100',
        url: '/api/login'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: 'XSS Attack',
        message: 'Cross-site scripting attempt blocked',
        severity: 'medium',
        ip: '10.0.0.50',
        url: '/api/search'
      }
    ];
  }

  getMockSystemStatus(): SystemStatus {
    return {
      proxy: {
        host: 'localhost',
        port: 8080,
        status: 'online',
        pid: 12345
      },
      backend: {
        host: 'localhost',
        port: 5000,
        status: 'online'
      },
      ml_model: {
        status: 'online',
        threshold: 0.7
      },
      content_filter: {
        enabled: true,
        active_categories: 5
      },
      popup_blocker: {
        enabled: true,
        aggressiveness: 'medium'
      }
    };
  }

  getMockTrafficData(): any {
    return {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [{
        label: 'Legitimate',
        data: [120, 150, 180, 220, 190, 160],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4
      }]
    };
  }

  getMockAttacksData(): any {
    return {
      labels: ['SQL Injection', 'XSS', 'CSRF', 'Directory Traversal', 'Command Injection'],
      datasets: [{
        label: 'Attack Types',
        data: [45, 32, 28, 19, 15],
        backgroundColor: [
          '#e74c3c',
          '#f39c12',
          '#27ae60',
          '#3498db',
          '#9b59b6'
        ]
      }]
    };
  }
}

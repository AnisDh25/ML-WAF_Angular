import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-system-status',
  imports: [CommonModule, FormsModule],
  templateUrl: './system-status.html',
  styleUrl: './system-status.scss'
})
export class SystemStatus implements OnInit, OnDestroy {
  systemStatus: any = {
    cpu: { usage: 0, cores: 4, temperature: 45 },
    memory: { total: 8192, used: 4096, available: 4096, percentage: 50 },
    disk: { total: 500, used: 250, available: 250, percentage: 50 },
    network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
    database: { connections: 5, uptime: '2 days, 14 hours', size: '125 MB' },
    services: {
      waf_proxy: { status: 'running', uptime: '2 days, 14 hours', memory: '45 MB' },
      ml_classifier: { status: 'running', uptime: '2 days, 14 hours', memory: '128 MB' },
      database: { status: 'running', uptime: '30 days, 5 hours', memory: '256 MB' },
      api_server: { status: 'running', uptime: '2 days, 14 hours', memory: '64 MB' }
    }
  };

  isLoading = true;
  isSyncing = false;
  lastSyncTime: Date | null = null;

  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 5000; // 5 seconds for system status

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSystemStatus();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadSystemStatus(): void {
    this.isSyncing = true;
    
    // Simulate API call with mock data
    setTimeout(() => {
      // Update CPU usage with random variation
      this.systemStatus.cpu.usage = Math.max(10, Math.min(90, this.systemStatus.cpu.usage + (Math.random() - 0.5) * 10));
      this.systemStatus.cpu.temperature = Math.max(35, Math.min(75, this.systemStatus.cpu.temperature + (Math.random() - 0.5) * 5));
      
      // Update memory usage
      const memoryUsed = Math.max(2048, Math.min(6144, this.systemStatus.memory.used + (Math.random() - 0.5) * 200));
      this.systemStatus.memory.used = Math.round(memoryUsed);
      this.systemStatus.memory.available = this.systemStatus.memory.total - this.systemStatus.memory.used;
      this.systemStatus.memory.percentage = Math.round((this.systemStatus.memory.used / this.systemStatus.memory.total) * 100);
      
      // Update network stats
      this.systemStatus.network.bytesIn += Math.floor(Math.random() * 10000);
      this.systemStatus.network.bytesOut += Math.floor(Math.random() * 8000);
      this.systemStatus.network.packetsIn += Math.floor(Math.random() * 50);
      this.systemStatus.network.packetsOut += Math.floor(Math.random() * 40);
      
      // Update database connections
      this.systemStatus.database.connections = Math.max(1, Math.min(20, this.systemStatus.database.connections + Math.floor((Math.random() - 0.5) * 3)));
      
      this.lastSyncTime = new Date();
      this.isSyncing = false;
      this.isLoading = false;
    }, 500);
  }

  // Real-time synchronization methods
  startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadSystemStatus();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Manual refresh method
  refreshSystemStatus(): void {
    this.loadSystemStatus();
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

  // Helper methods for status styling
  getCpuStatusClass(usage: number): string {
    if (usage < 50) return 'success';
    if (usage < 80) return 'warning';
    return 'danger';
  }

  getMemoryStatusClass(percentage: number): string {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

  getDiskStatusClass(percentage: number): string {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

  getServiceStatusClass(status: string): string {
    return status === 'running' ? 'success' : 'danger';
  }

  getServiceName(key: string): string {
    // Convert service key to readable name
    const serviceNames: { [key: string]: string } = {
      'waf_proxy': 'WAF Proxy',
      'ml_classifier': 'ML Classifier',
      'database': 'Database',
      'api_server': 'API Server'
    };
    return serviceNames[key] || key;
  }

  getServiceDisplayName(key: string | number): string {
    // Handle both string and number keys
    return this.getServiceName(String(key));
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(uptime: string): string {
    return uptime;
  }
}

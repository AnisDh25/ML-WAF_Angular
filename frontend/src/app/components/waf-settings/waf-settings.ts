import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-waf-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './waf-settings.html',
  styleUrl: './waf-settings.scss',
})
export class WafSettings implements OnInit, OnDestroy {
  settings: any = {
    proxy: {
      host: '127.0.0.1',
      port: 8080,
      enabled: true
    },
    ml_classifier: {
      threshold: 0.7,
      enabled: true
    },
    content_filter: {
      enabled: true,
      categories: ['malicious', 'spam']
    }
  };
  
  isLoading = false;
  isSaving = false;
  
  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds for settings
  lastSyncTime: Date | null = null;
  isSyncing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSettings();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadSettings(): void {
    this.isLoading = true;
    // Placeholder for loading settings
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  saveSettings(): void {
    this.isSaving = true;
    // Placeholder for saving settings
    setTimeout(() => {
      this.isSaving = false;
      alert('Settings saved successfully!');
      this.lastSyncTime = new Date();
    }, 1000);
  }

  // Real-time synchronization methods
  startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadSettings();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Manual refresh method
  refreshSettings(): void {
    this.loadSettings();
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

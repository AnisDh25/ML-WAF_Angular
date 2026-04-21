import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit, OnDestroy {
  currentUser: any = null;
  isLoading = true;
  isSyncing = false;
  lastSyncTime: Date | null = null;

  // Profile form data
  profileForm = {
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Activity log
  recentActivity: any[] = [
    { action: 'Login', timestamp: new Date(Date.now() - 3600000), details: 'Successful login from 192.168.1.100' },
    { action: 'Password Change', timestamp: new Date(Date.now() - 86400000), details: 'Password changed successfully' },
    { action: 'Settings Update', timestamp: new Date(Date.now() - 172800000), details: 'Updated notification preferences' }
  ];

  // User statistics
  userStats = {
    totalLogins: 156,
    lastLogin: new Date(Date.now() - 3600000),
    accountCreated: new Date(Date.now() - 2592000000),
    failedLogins: 3,
    passwordChanges: 2
  };

  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 10000; // 10 seconds for profile

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadProfile();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadProfile(): void {
    this.isSyncing = true;
    
    // Use actual API call
    this.apiService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.currentUser = {
            ...response.user,
            lastLogin: new Date(Date.now() - 3600000),
            createdAt: new Date(Date.now() - 2592000000),
            avatar: `https://picsum.photos/seed/${response.user.username}/100/100.jpg`,
            preferences: {
              theme: 'light',
              notifications: true,
              language: 'en',
              timezone: 'UTC'
            }
          };

          this.profileForm.username = this.currentUser.username;
          this.profileForm.email = this.currentUser.email;
        } else {
          // Fallback to mock data if API fails
          this.currentUser = {
            id: 1,
            username: 'admin',
            email: 'admin@waf.local',
            role: 'admin',
            isActive: true,
            lastLogin: new Date(Date.now() - 3600000),
            createdAt: new Date(Date.now() - 2592000000),
            loginAttempts: 0,
            avatar: 'https://picsum.photos/seed/admin/100/100.jpg',
            preferences: {
              theme: 'light',
              notifications: true,
              language: 'en',
              timezone: 'UTC'
            }
          };

          this.profileForm.username = this.currentUser.username;
          this.profileForm.email = this.currentUser.email;
        }

        // Update last login time periodically
        this.userStats.lastLogin = new Date(Date.now() - Math.random() * 3600000);

        this.lastSyncTime = new Date();
        this.isSyncing = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        // Fallback to mock data on error
        this.currentUser = {
          id: 1,
          username: 'admin',
          email: 'admin@waf.local',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(Date.now() - 3600000),
          createdAt: new Date(Date.now() - 2592000000),
          loginAttempts: 0,
          avatar: 'https://picsum.photos/seed/admin/100/100.jpg',
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en',
            timezone: 'UTC'
          }
        };

        this.profileForm.username = this.currentUser.username;
        this.profileForm.email = this.currentUser.email;

        this.lastSyncTime = new Date();
        this.isSyncing = false;
        this.isLoading = false;
      }
    });
  }

  // Real-time synchronization methods
  startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadProfile();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Manual refresh method
  refreshProfile(): void {
    this.loadProfile();
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

  // Profile update methods
  updateProfile(): void {
    if (!this.profileForm.username || !this.profileForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profileForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Use actual API call
    this.isLoading = true;
    
    if (this.currentUser) {
      this.apiService.updateUser(this.currentUser.id, {
        username: this.profileForm.username,
        email: this.profileForm.email
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUser.username = this.profileForm.username;
            this.currentUser.email = this.profileForm.email;
            
            // Add to activity log
            this.recentActivity.unshift({
              action: 'Profile Update',
              timestamp: new Date(),
              details: 'Updated profile information'
            });

            this.isLoading = false;
            alert('Profile updated successfully!');
          } else {
            this.isLoading = false;
            alert(response.error || 'Failed to update profile');
          }
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading = false;
          alert('Failed to update profile. Please try again.');
        }
      });
    }
  }

  changePassword(): void {
    if (!this.profileForm.currentPassword || !this.profileForm.newPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (this.profileForm.newPassword !== this.profileForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (this.profileForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Use actual API call
    this.isLoading = true;
    
    this.apiService.changePassword(
      this.profileForm.currentPassword,
      this.profileForm.newPassword,
      this.profileForm.confirmPassword
    ).subscribe({
      next: (response) => {
        // Add to activity log
        this.recentActivity.unshift({
          action: 'Password Change',
          timestamp: new Date(),
          details: 'Password changed successfully'
        });

        // Clear password fields
        this.profileForm.currentPassword = '';
        this.profileForm.newPassword = '';
        this.profileForm.confirmPassword = '';

        this.isLoading = false;
        alert('Password changed successfully!');
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.isLoading = false;
        alert('Failed to change password. Please check your current password and try again.');
      }
    });
  }

  // Helper methods
  formatDate(date: Date): string {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  formatDateFromNow(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'danger';
      case 'responsible-it': return 'primary';
      default: return 'secondary';
    }
  }

  getActivityIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'login': return 'fa-sign-in-alt';
      case 'logout': return 'fa-sign-out-alt';
      case 'password change': return 'fa-key';
      case 'profile update': return 'fa-user-edit';
      case 'settings update': return 'fa-cog';
      default: return 'fa-info-circle';
    }
  }
}

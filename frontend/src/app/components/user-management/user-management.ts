import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit, OnDestroy {
  users: any[] = [];
  isLoading = true;
  showAddUserModal = false;
  editingUser: any = null;
  
  // Real-time synchronization
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 10000; // 10 seconds
  lastSyncTime: Date | null = null;
  isSyncing = false;
  
  newUser = {
    username: '',
    email: '',
    role: 'responsible-it',
    password: '',
    confirmPassword: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadUsers(): void {
    this.isSyncing = true;
    
    // Load users from API
    this.apiService.getUsers().subscribe({
      next: (response: any) => {
        if (response && response.success && response.users) {
          // Map backend response to frontend format
          this.users = response.users.map((user: any) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: Boolean(user.is_active), // Convert integer to boolean
            lastLogin: user.last_login, // Map snake_case to camelCase
            createdAt: user.created_at
          }));
        } else {
          this.users = [];
        }
        this.lastSyncTime = new Date();
        this.isSyncing = false;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.isSyncing = false;
        this.isLoading = false;
      }
    });
  }

  // Real-time synchronization methods
  startPolling(): void {
    // Start polling for real-time updates
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadUsers();
    });
  }

  stopPolling(): void {
    // Stop polling when component is destroyed
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Manual refresh method
  refreshUsers(): void {
    this.loadUsers();
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

  addUser(): void {
    // Validate form
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.newUser.password !== this.newUser.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (this.newUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Create user via API
    this.apiService.createUser(this.newUser).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(response.message || 'User created successfully');
          this.closeAddUserModal();
          this.loadUsers(); // Refresh users list
        } else {
          alert(response.error || 'Failed to create user');
        }
      },
      error: (error: any) => {
        console.error('Error creating user:', error);
        alert('Failed to create user. Please try again.');
      }
    });
  }

  editUser(user: any): void {
    this.editingUser = { ...user };
  }

  updateUser(): void {
    if (!this.editingUser || !this.editingUser.id) {
      alert('Invalid user data');
      return;
    }

    this.apiService.updateUser(this.editingUser.id, this.editingUser).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(response.message || 'User updated successfully');
          this.editingUser = null;
          this.loadUsers(); // Refresh users list
        } else {
          alert(response.error || 'Failed to update user');
        }
      },
      error: (error: any) => {
        console.error('Error updating user:', error);
        alert('Failed to update user. Please try again.');
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.apiService.deleteUser(userId).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert(response.message || 'User deleted successfully');
            this.loadUsers(); // Refresh users list
          } else {
            alert(response.error || 'Failed to delete user');
          }
        },
        error: (error: any) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

  toggleUserStatus(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isActive = !user.isActive;
    }
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.newUser = {
      username: '',
      email: '',
      role: 'responsible-it',
      password: '',
      confirmPassword: ''
    };
  }

  // Helper method for badge styling
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'danger';
      case 'responsible-it': return 'primary';
      case 'user': return 'secondary';
      default: return 'secondary';
    }
  }
}

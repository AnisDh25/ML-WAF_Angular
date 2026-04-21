import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface Stats {
  total_requests: number;
  blocked_requests: number;
  high_risk_requests: number;
  block_rate: number;
  top_blocked_ips: Array<{ ip: string; count: number }>;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  ip: string;
  method: string;
  url: string;
  decision: string;
  risk_score?: number;
}

export interface Alert {
  id: number;
  timestamp: string;
  type: string;
  message: string;
  severity: string;
  ip?: string;
  url?: string;
}

export interface Config {
  proxy: {
    host: string;
    port: number;
  };
  backend: {
    host: string;
    port: number;
  };
  ml_classifier: {
    threshold: number;
  };
  content_filter: {
    enabled: boolean;
    categories: string[];
    active_categories: string[];
    blacklist: string[];
    whitelist: string[];
  };
  popup_blocker: {
    enabled: boolean;
    aggressiveness: string;
  };
}

export interface SystemStatus {
  proxy: {
    host: string;
    port: number;
    status: string;
    pid?: number;
  };
  backend: {
    host: string;
    port: number;
    status: string;
  };
  ml_model: {
    status: string;
    threshold: number;
  };
  content_filter: {
    enabled: boolean;
    active_categories: number;
  };
  popup_blocker: {
    enabled: boolean;
    aggressiveness: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api';
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  get token(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  get currentUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  private getHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Authentication
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, 
      { username, password }, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          this.tokenSubject.next(response.token);
          if (response.user) {
            this.userSubject.next(response.user);
          }
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        localStorage.removeItem('token');
        this.tokenSubject.next(null);
        this.userSubject.next(null);
      })
    );
  }

  getProfile(): Observable<{ success: boolean; user?: User; error?: string }> {
    return this.http.get<{ success: boolean; user?: User; error?: string }>(
      `${this.apiUrl}/auth/profile`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.userSubject.next(response.user);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change_password`, {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    }, { headers: this.getHeaders() });
  }

  // Dashboard
  getStats(): Observable<Stats> {
    const headers = this.getHeaders();
    console.log('API Service - getStats headers:', headers);
    console.log('API Service - getStats URL:', `${this.apiUrl}/stats`);
    return this.http.get<Stats>(`${this.apiUrl}/stats`, { headers });
  }

  // Logs
  getLogs(limit: number = 100): Observable<{ logs: LogEntry[] }> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ logs: LogEntry[] }>(`${this.apiUrl}/logs`, { 
      params,
      headers: this.getHeaders()
    });
  }

  searchLogs(query: string, field: string = 'url', limit: number = 100): Observable<{ results: LogEntry[] }> {
    const params = new HttpParams()
      .set('query', query)
      .set('field', field)
      .set('limit', limit.toString());
    return this.http.get<{ results: LogEntry[] }>(`${this.apiUrl}/logs/search`, { 
      params,
      headers: this.getHeaders()
    });
  }

  // Alerts
  getAlerts(limit: number = 50): Observable<{ alerts: Alert[] }> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ alerts: Alert[] }>(`${this.apiUrl}/alerts`, { 
      params,
      headers: this.getHeaders()
    });
  }

  // Configuration
  getConfig(): Observable<Config> {
    return this.http.get<Config>(`${this.apiUrl}/config`, { headers: this.getHeaders() });
  }

  updateConfig(config: Partial<Config>): Observable<any> {
    return this.http.post(`${this.apiUrl}/config/update`, config, { headers: this.getHeaders() });
  }

  // Content Filter
  toggleContentFilterCategory(category: string, action: 'enable' | 'disable'): Observable<any> {
    return this.http.post(`${this.apiUrl}/content_filter/category/${action}`, 
      { category }, 
      { headers: this.getHeaders() }
    );
  }

  addToBlacklist(domain: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/content_filter/blacklist`, 
      { domain }, 
      { headers: this.getHeaders() }
    );
  }

  removeFromBlacklist(domain: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/content_filter/blacklist`, 
      { 
        headers: this.getHeaders(),
        body: { domain }
      }
    );
  }

  addToWhitelist(domain: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/content_filter/whitelist`, 
      { domain }, 
      { headers: this.getHeaders() }
    );
  }

  removeFromWhitelist(domain: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/content_filter/whitelist`, 
      { 
        headers: this.getHeaders(),
        body: { domain }
      }
    );
  }

  // Popup Blocker
  togglePopupBlocker(enabled: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/popup_blocker/toggle`, 
      { enabled }, 
      { headers: this.getHeaders() }
    );
  }

  setPopupBlockerAggressiveness(level: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/popup_blocker/aggressiveness`, 
      { level }, 
      { headers: this.getHeaders() }
    );
  }

  // Charts
  getTrafficChart(): Observable<{ labels: string[]; legitimate: number[]; blocked: number[] }> {
    return this.http.get<{ labels: string[]; legitimate: number[]; blocked: number[] }>(
      `${this.apiUrl}/chart/traffic`
    );
  }

  getAttacksChart(): Observable<{ labels: string[]; data: number[] }> {
    return this.http.get<{ labels: string[]; data: number[] }>(
      `${this.apiUrl}/chart/attacks`
    );
  }

  // Proxy Management
  startProxy(): Observable<any> {
    return this.http.post(`${this.apiUrl}/proxy/start`, {}, { headers: this.getHeaders() });
  }

  stopProxy(): Observable<any> {
    return this.http.post(`${this.apiUrl}/proxy/stop`, {}, { headers: this.getHeaders() });
  }

  // System Status
  getSystemStatus(): Observable<SystemStatus> {
    return this.http.get<SystemStatus>(`${this.apiUrl}/status`);
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  // Utility method to get current user role
  getCurrentUserRole(): Observable<string | null> {
    return this.userSubject.asObservable().pipe(
      map(user => user ? user.role : null)
    );
  }

  // User Management
  getUsers(): Observable<{ success: boolean; users: User[] }> {
    return this.http.get<{ success: boolean; users: User[] }>(
      `${this.apiUrl}/users`,
      { headers: this.getHeaders() }
    );
  }

  createUser(userData: any): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${this.apiUrl}/users`,
      userData,
      { headers: this.getHeaders() }
    );
  }

  updateUser(userId: number, userData: any): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.put<{ success: boolean; message?: string; error?: string }>(
      `${this.apiUrl}/users/${userId}`,
      userData,
      { headers: this.getHeaders() }
    );
  }

  deleteUser(userId: number): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.delete<{ success: boolean; message?: string; error?: string }>(
      `${this.apiUrl}/users/${userId}`,
      { headers: this.getHeaders() }
    );
  }
}

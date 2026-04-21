import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { LogsExporter } from './components/logs-exporter/logs-exporter';
import { MlMonitor } from './components/ml-monitor/ml-monitor';
import { WafSettings } from './components/waf-settings/waf-settings';
import { UserManagement } from './components/user-management/user-management';
import { SystemStatus } from './components/system-status/system-status';
import { Profile } from './components/profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'logs', component: LogsExporter, canActivate: [AuthGuard] },
  { path: 'ml-monitor', component: MlMonitor, canActivate: [AuthGuard] },
  { path: 'waf-settings', component: WafSettings, canActivate: [AuthGuard] },
  { path: 'user-management', component: UserManagement, canActivate: [AuthGuard] },
  { path: 'system-status', component: SystemStatus, canActivate: [AuthGuard] },
  { path: 'profile', component: Profile, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/dashboard' }
];

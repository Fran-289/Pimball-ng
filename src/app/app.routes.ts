import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Inventory } from './features/inventory/inventory';
import { Cuts } from './features/cuts/cuts';
import { Tickets } from './features/tickets/tickets';
import { Backups } from './features/backups/backups';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'inventory', component: Inventory },
  { path: 'cuts', component: Cuts },
  { path: 'tickets', component: Tickets },
  { path: 'backups', component: Backups },
  { path: '**', redirectTo: 'dashboard' }
];

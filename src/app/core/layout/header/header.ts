import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../../services/data.service';
import { SecurityService } from '../../services/security.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, CommonModule, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  pageTitle = 'Sistema';
  
  isDarkMode = true;
  userProfile: any = {};

  notifications: any[] = [];
  showNotifications = false;

  constructor(private dataService: DataService, private security: SecurityService, private router: Router, public auth: AuthService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updatePageTitle(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit() {
    this.userProfile = this.dataService.getUserProfile();
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.updatePageTitle(this.router.url);
    this.generateNotifications();

    this.dataService.dataChanged.subscribe(() => {
      this.generateNotifications();
    });
  }

  generateNotifications() {
    this.notifications = [];
    const cuts = this.dataService.getCuts();
    const locations = this.dataService.getLocations();
    const machines = this.dataService.getMachines();
    const activeLocations = new Set(machines.filter(m => m.status === 'active').map(m => m.locationId));
    const locMap = new Map<string, any>();
    
    const showCuts = localStorage.getItem('pm_notif_cuts') !== 'false';
    const showTickets = localStorage.getItem('pm_notif_tickets') !== 'false';

    for (const c of cuts) {
      if (!c.isCancelled) {
        if (!locMap.has(c.locationId) || new Date(c.date).getTime() > new Date(locMap.get(c.locationId).date).getTime()) {
            locMap.set(c.locationId, c);
        }
      }
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);

    if (showCuts) {
      for (const locId of locMap.keys()) {
         if (!activeLocations.has(locId)) continue;
         const latestCut = locMap.get(locId);
         if (latestCut.nextCutDate) {
            const nextDate = new Date(latestCut.nextCutDate);
            const [y, m, d] = latestCut.nextCutDate.split('-');
            const localNextDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            localNextDate.setHours(0,0,0,0);
            
            if (localNextDate <= inThreeDays) {
               const loc = locations.find(l => l.id === locId);
               const diffTime = localNextDate.getTime() - today.getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               if (diffDays >= 0) {
                 let timeText = diffDays === 0 ? 'hoy' : (diffDays === 1 ? 'mañana' : `en ${diffDays} días`);
                 this.notifications.push({
                    id: Math.random().toString(),
                    title: `Próximo Corte: ${loc ? loc.name : 'Ubicación'}`,
                    message: `Recordatorio: próximo corte ${timeText} (día ${localNextDate.toLocaleDateString('es-ES')})`,
                    type: 'warning'
                 });
               } else {
                 this.notifications.push({
                    id: Math.random().toString(),
                    title: `Corte Atrasado: ${loc ? loc.name : 'Ubicación'}`,
                    message: `El corte estaba programado para el día ${localNextDate.toLocaleDateString('es-ES')} (hace ${Math.abs(diffDays)} días)`,
                    type: 'danger'
                 });
               }
            }
         }
      }
    }

    const tickets = this.dataService.getTickets();
    if (showTickets) {
      const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
      
      for (const t of activeTickets) {
         const m = machines.find(mac => mac.id === t.machineId);
         const mName = m ? m.name : t.machineId;
         const statusStr = t.status === 'open' ? 'ABIERTO' : 'EN PROGRESO';
         const dateStr = new Date(t.createdAt).toLocaleDateString('es-ES');
         
         this.notifications.unshift({
            id: Math.random().toString(),
            title: `[${statusStr}] Reparación: ${mName}`,
            message: `${t.title} (creado el ${dateStr})`,
            type: t.status === 'open' ? 'danger' : 'warning'
         });
      }
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  updatePageTitle(url: string) {
    if (url.includes('/dashboard')) this.pageTitle = 'Dashboard';
    else if (url.includes('/inventory')) this.pageTitle = 'Máquinas';
    else if (url.includes('/cuts')) this.pageTitle = 'Cortes';
    else if (url.includes('/tickets')) this.pageTitle = 'Reparaciones';
    else if (url.includes('/audit')) this.pageTitle = 'Auditoría';
    else if (url.includes('/backups')) this.pageTitle = 'Respaldos';
    else if (url.includes('/records')) this.pageTitle = 'Registros';
    else if (url.includes('/settings')) this.pageTitle = 'Configuración';
    else this.pageTitle = 'Sistema';
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  openInfoModal() {
    this.router.navigate(['/settings']);
  }
}

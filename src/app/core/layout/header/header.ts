import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../../services/data.service';
import { SecurityService } from '../../services/security.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  pageTitle = 'Sistema';
  
  isInfoModalOpen = false;
  isEditModalOpen = false;
  isImageModalOpen = false;

  isDarkMode = true;
  userProfile: any = {};
  editProfile: any = {};

  notifications: any[] = [];
  showNotifications = false;

  constructor(private dataService: DataService, private security: SecurityService, private router: Router) {
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

    for (const locId of locMap.keys()) {
       if (!activeLocations.has(locId)) continue;
       const latestCut = locMap.get(locId);
       if (latestCut.nextCutDate) {
          const nextDate = new Date(latestCut.nextCutDate);
          // adjust timezone issue by adding timezone offset before getting time? 
          // new Date("YYYY-MM-DD") creates UTC midnight. 
          // Let's create it locally to match input type="date"
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
    this.isInfoModalOpen = true;
  }

  closeInfoModal() {
    this.isInfoModalOpen = false;
  }

  openEditModal() {
    this.isInfoModalOpen = false;
    this.editProfile = { ...this.userProfile };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  openImageModal(event: Event) {
    event.stopPropagation();
    this.isImageModalOpen = true;
  }

  closeImageModal() {
    this.isImageModalOpen = false;
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // VUL-6: Validate file is actually an image
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP).');
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo: 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = this.security.sanitizeDataUrl(e.target.result);
      if (dataUrl) {
        this.editProfile.photo = dataUrl;
      } else {
        alert('El archivo no es una imagen válida.');
      }
    };
    reader.readAsDataURL(file);
  }

  saveProfile() {
    this.userProfile = { ...this.editProfile };
    this.dataService.saveUserProfile(this.userProfile);
    this.isEditModalOpen = false;
    this.isInfoModalOpen = true;
  }
}

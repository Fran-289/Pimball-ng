import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './settings.html'
})
export class Settings implements OnInit {
  activeTab: 'profile' | 'appearance' | 'security' | 'notifications' | 'accessibility' | 'system' = 'profile';

  // Profile
  editProfile: any = { name: '', photo: '', email: '' };

  // Appearance
  themeMode: 'light' | 'dark' | 'auto' = 'auto';

  // Security
  pinInput = '';
  biometricAvailable = false;
  fingerprintEnabled = false;
  faceIdEnabled = false;

  // Notifications
  notifications = {
    tickets: true,
    cuts: true,
    system: true
  };

  // Accessibility
  fontSize: 'normal' | 'large' = 'normal';
  language: 'es' | 'en' = 'es';

  constructor(
    public dataService: DataService,
    public auth: AuthService,
    private router: Router,
    private translationService: TranslationService
  ) {}

  async ngOnInit() {
    const profile = this.dataService.getUserProfile();
    this.editProfile = { ...profile };
    
    this.themeMode = (localStorage.getItem('theme') as 'light' | 'dark' | 'auto') || 'auto';
    this.fingerprintEnabled = localStorage.getItem('pm_fingerprint') === 'true';
    this.faceIdEnabled = localStorage.getItem('pm_faceid') === 'true';
    this.biometricAvailable = await this.auth.isBiometricAvailable();

    // In a real app we'd load these from a settings service or localStorage
    this.notifications.tickets = localStorage.getItem('pm_notif_tickets') !== 'false';
    this.notifications.cuts = localStorage.getItem('pm_notif_cuts') !== 'false';
    this.notifications.system = localStorage.getItem('pm_notif_system') !== 'false';
    
    this.fontSize = (localStorage.getItem('pm_font_size') as 'normal'|'large') || 'normal';
    this.language = (localStorage.getItem('pm_language') as 'es'|'en') || 'es';
    
    this.applyFontSize();
    this.applyTheme();
  }

  saveProfile() {
    this.dataService.saveUserProfile(this.editProfile);
    alert('Perfil guardado correctamente');
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editProfile.photo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  setTheme(mode: 'light' | 'dark' | 'auto') {
    this.themeMode = mode;
    localStorage.setItem('theme', mode);
    this.applyTheme();
  }

  applyTheme() {
    let isDark = false;
    if (this.themeMode === 'auto') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = this.themeMode === 'dark';
    }
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  saveSecurity() {
    if (this.pinInput && this.pinInput.length === 4) {
      this.auth.setPin(this.pinInput);
      this.pinInput = '';
      alert('PIN configurado correctamente');
    }
    this.auth.setBiometricEnabled(this.fingerprintEnabled || this.faceIdEnabled);
    localStorage.setItem('pm_fingerprint', this.fingerprintEnabled ? 'true' : 'false');
    localStorage.setItem('pm_faceid', this.faceIdEnabled ? 'true' : 'false');
  }

  removePin() {
    if (confirm('¿Estás seguro de eliminar el PIN?')) {
      this.auth.removePin();
      this.fingerprintEnabled = false;
      this.faceIdEnabled = false;
      localStorage.setItem('pm_fingerprint', 'false');
      localStorage.setItem('pm_faceid', 'false');
      this.pinInput = '';
    }
  }

  toggleNotification(type: 'tickets' | 'cuts' | 'system') {
    this.notifications[type] = !this.notifications[type];
    localStorage.setItem(`pm_notif_${type}`, this.notifications[type] ? 'true' : 'false');
  }

  changeFontSize(size: 'normal' | 'large') {
    this.fontSize = size;
    localStorage.setItem('pm_font_size', size);
    this.applyFontSize();
  }

  changeLanguage(lang: 'es' | 'en') {
    this.language = lang;
    this.translationService.setLanguage(lang);
  }

  applyFontSize() {
    if (this.fontSize === 'large') {
      document.documentElement.classList.add('text-large');
    } else {
      document.documentElement.classList.remove('text-large');
    }
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const TRANSLATIONS = {
  es: {
    'SIDEBAR.DASHBOARD': 'Dashboard',
    'SIDEBAR.MACHINES': 'Máquinas',
    'SIDEBAR.CUTS': 'Cortes',
    'SIDEBAR.RECORDS': 'Registros',
    'SIDEBAR.TICKETS': 'Reparaciones',
    'SIDEBAR.PREFERENCES': 'Preferencias',
    'SIDEBAR.SETTINGS': 'Configuración',
    'SETTINGS.TITLE': 'Configuración Central',
    'SETTINGS.TAB_PROFILE': 'Perfil',
    'SETTINGS.TAB_APPEARANCE': 'Apariencia',
    'SETTINGS.TAB_SECURITY': 'Seguridad',
    'SETTINGS.TAB_NOTIFICATIONS': 'Notificaciones',
    'SETTINGS.TAB_ACCESSIBILITY': 'Accesibilidad',
    'SETTINGS.TAB_SYSTEM': 'Herramientas del Sistema',
    'SETTINGS.PROFILE_TITLE': 'Editar Perfil',
    'SETTINGS.PROFILE_NAME': 'Nombre',
    'SETTINGS.PROFILE_EMAIL': 'Correo Electrónico',
    'SETTINGS.CHANGE_PHOTO': 'Cambiar Foto',
    'SETTINGS.SAVE_CHANGES': 'Guardar Cambios',
    'SETTINGS.APPEARANCE_TITLE': 'Apariencia y Tema',
    'SETTINGS.THEME_LIGHT': 'Claro',
    'SETTINGS.THEME_DARK': 'Oscuro',
    'SETTINGS.THEME_AUTO': 'Automático',
    'SETTINGS.SECURITY_TITLE': 'Seguridad (App Lock)',
    'SETTINGS.SECURITY_PIN_ACTIVE': 'PIN Activado',
    'SETTINGS.SECURITY_APP_PROTECTED': 'La app está protegida',
    'SETTINGS.REMOVE_PIN': 'Eliminar PIN',
    'SETTINGS.SET_PIN': 'Configurar PIN (4 dígitos)',
    'SETTINGS.SET_PIN_DESC': 'Configura un PIN para bloquear la app al salir.',
    'SETTINGS.FINGERPRINT': 'Huella Digital',
    'SETTINGS.FINGERPRINT_DESC': 'Desbloquea con tu huella',
    'SETTINGS.FACEID': 'Face ID',
    'SETTINGS.FACEID_DESC': 'Desbloquea con tu rostro',
    'SETTINGS.NOTIFICATIONS_TITLE': 'Preferencias de Alertas',
    'SETTINGS.NOTIF_TICKETS': 'Alertas de Tickets',
    'SETTINGS.NOTIF_TICKETS_DESC': 'Avisos sobre reparaciones',
    'SETTINGS.NOTIF_CUTS': 'Alertas de Cortes',
    'SETTINGS.NOTIF_CUTS_DESC': 'Recordatorios de próximos cortes',
    'SETTINGS.NOTIF_SYSTEM': 'Alertas del Sistema',
    'SETTINGS.NOTIF_SYSTEM_DESC': 'Información general de la app',
    'SETTINGS.ACCESSIBILITY_TITLE': 'Accesibilidad e Idioma',
    'SETTINGS.TEXT_SIZE': 'Tamaño del Texto',
    'SETTINGS.TEXT_SIZE_NORMAL': 'Normal',
    'SETTINGS.TEXT_SIZE_LARGE': 'Grande',
    'SETTINGS.LANGUAGE': 'Idioma',
    'SETTINGS.LANGUAGE_ES': 'Español',
    'SETTINGS.LANGUAGE_EN': 'Inglés',
    'SETTINGS.SYSTEM_TITLE': 'Módulos Administrativos',
    'SETTINGS.SYSTEM_AUDIT': 'Auditoría',
    'SETTINGS.SYSTEM_AUDIT_DESC': 'Control de caja y reportes financieros',
    'SETTINGS.SYSTEM_RECORDS': 'Registro Histórico',
    'SETTINGS.SYSTEM_RECORDS_DESC': 'Ver historial de movimientos y cortes',
    'SETTINGS.SYSTEM_BACKUPS': 'Respaldos de Datos',
    'SETTINGS.SYSTEM_BACKUPS_DESC': 'Gestionar la seguridad de la información',
    'HEADER.NOTIFICATIONS_TITLE': 'Centro de Notificaciones',
    'HEADER.ALL_GOOD': 'Todo al día',
    'HEADER.NO_NOTIFICATIONS': 'No tienes recordatorios de cortes pendientes.',
    'HEADER.CLOSE': 'Cerrar'
  },
  en: {
    'SIDEBAR.DASHBOARD': 'Dashboard',
    'SIDEBAR.MACHINES': 'Machines',
    'SIDEBAR.CUTS': 'Cuts',
    'SIDEBAR.RECORDS': 'Records',
    'SIDEBAR.TICKETS': 'Repairs',
    'SIDEBAR.PREFERENCES': 'Preferences',
    'SIDEBAR.SETTINGS': 'Settings',
    'SETTINGS.TITLE': 'Central Settings',
    'SETTINGS.TAB_PROFILE': 'Profile',
    'SETTINGS.TAB_APPEARANCE': 'Appearance',
    'SETTINGS.TAB_SECURITY': 'Security',
    'SETTINGS.TAB_NOTIFICATIONS': 'Notifications',
    'SETTINGS.TAB_ACCESSIBILITY': 'Accessibility',
    'SETTINGS.TAB_SYSTEM': 'System Tools',
    'SETTINGS.PROFILE_TITLE': 'Edit Profile',
    'SETTINGS.PROFILE_NAME': 'Name',
    'SETTINGS.PROFILE_EMAIL': 'Email Address',
    'SETTINGS.CHANGE_PHOTO': 'Change Photo',
    'SETTINGS.SAVE_CHANGES': 'Save Changes',
    'SETTINGS.APPEARANCE_TITLE': 'Appearance and Theme',
    'SETTINGS.THEME_LIGHT': 'Light',
    'SETTINGS.THEME_DARK': 'Dark',
    'SETTINGS.THEME_AUTO': 'Auto',
    'SETTINGS.SECURITY_TITLE': 'Security (App Lock)',
    'SETTINGS.SECURITY_PIN_ACTIVE': 'PIN Active',
    'SETTINGS.SECURITY_APP_PROTECTED': 'App is protected',
    'SETTINGS.REMOVE_PIN': 'Remove PIN',
    'SETTINGS.SET_PIN': 'Setup PIN (4 digits)',
    'SETTINGS.SET_PIN_DESC': 'Set a PIN to lock the app on exit.',
    'SETTINGS.FINGERPRINT': 'Fingerprint',
    'SETTINGS.FINGERPRINT_DESC': 'Unlock with your fingerprint',
    'SETTINGS.FACEID': 'Face ID',
    'SETTINGS.FACEID_DESC': 'Unlock with your face',
    'SETTINGS.NOTIFICATIONS_TITLE': 'Alert Preferences',
    'SETTINGS.NOTIF_TICKETS': 'Ticket Alerts',
    'SETTINGS.NOTIF_TICKETS_DESC': 'Notifications for repairs',
    'SETTINGS.NOTIF_CUTS': 'Cut Alerts',
    'SETTINGS.NOTIF_CUTS_DESC': 'Reminders for upcoming cuts',
    'SETTINGS.NOTIF_SYSTEM': 'System Alerts',
    'SETTINGS.NOTIF_SYSTEM_DESC': 'General app information',
    'SETTINGS.ACCESSIBILITY_TITLE': 'Accessibility and Language',
    'SETTINGS.TEXT_SIZE': 'Text Size',
    'SETTINGS.TEXT_SIZE_NORMAL': 'Normal',
    'SETTINGS.TEXT_SIZE_LARGE': 'Large',
    'SETTINGS.LANGUAGE': 'Language',
    'SETTINGS.LANGUAGE_ES': 'Spanish',
    'SETTINGS.LANGUAGE_EN': 'English',
    'SETTINGS.SYSTEM_TITLE': 'Administrative Modules',
    'SETTINGS.SYSTEM_AUDIT': 'Audit',
    'SETTINGS.SYSTEM_AUDIT_DESC': 'Cash control and financial reports',
    'SETTINGS.SYSTEM_RECORDS': 'Historical Records',
    'SETTINGS.SYSTEM_RECORDS_DESC': 'View movement and cut history',
    'SETTINGS.SYSTEM_BACKUPS': 'Data Backups',
    'SETTINGS.SYSTEM_BACKUPS_DESC': 'Manage information security',
    'HEADER.NOTIFICATIONS_TITLE': 'Notification Center',
    'HEADER.ALL_GOOD': 'All caught up',
    'HEADER.NO_NOTIFICATIONS': 'You have no pending cut reminders.',
    'HEADER.CLOSE': 'Close'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<'es' | 'en'>('es');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    const savedLang = localStorage.getItem('pm_language') as 'es' | 'en';
    if (savedLang === 'es' || savedLang === 'en') {
      this.currentLanguageSubject.next(savedLang);
    }
  }

  setLanguage(lang: 'es' | 'en') {
    localStorage.setItem('pm_language', lang);
    this.currentLanguageSubject.next(lang);
  }

  get currentLanguage() {
    return this.currentLanguageSubject.value;
  }

  translate(key: string): string {
    const lang = this.currentLanguage;
    const dictionary = TRANSLATIONS[lang] as Record<string, string>;
    if (dictionary && dictionary[key]) {
      return dictionary[key];
    }
    return key;
  }
}

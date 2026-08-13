import { Injectable } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { SecurityService } from './security.service';

const PIN_KEY = 'pm_secure_pin';
const BIOMETRIC_KEY = 'pm_biometric_enabled';
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated = false; // Cambiará a false al iniciar si hay un PIN
  
  private lastActivityTime: number = Date.now();
  private inactivityInterval: any;

  constructor(private security: SecurityService) {
    this.checkInitialState();
    this.setupInactivityTimer();
  }

  private checkInitialState() {
    // Si no hay PIN configurado, está autenticado por defecto
    if (!this.hasPinConfigured()) {
      this.isAuthenticated = true;
    } else {
      this.isAuthenticated = false;
    }
  }

  hasPinConfigured(): boolean {
    return !!localStorage.getItem(PIN_KEY);
  }

  isBiometricEnabled(): boolean {
    return localStorage.getItem(BIOMETRIC_KEY) === 'true';
  }

  setBiometricEnabled(enabled: boolean): void {
    localStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
  }

  async verifyPin(pin: string): Promise<boolean> {
    const hashed = await this.security.computeChecksum(pin + '_PIN_SALT');
    const stored = localStorage.getItem(PIN_KEY);
    if (stored === hashed) {
      this.unlockApp();
      return true;
    }
    return false;
  }

  async setPin(pin: string): Promise<void> {
    const hashed = await this.security.computeChecksum(pin + '_PIN_SALT');
    localStorage.setItem(PIN_KEY, hashed);
    this.unlockApp(); // Al configurarlo, se desbloquea automáticamente
  }

  async removePin(): Promise<void> {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(BIOMETRIC_KEY);
    this.isAuthenticated = true;
  }

  async verifyBiometric(): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Desbloquear Pinball NG',
        title: 'Seguridad Biométrica',
        subtitle: 'Usa tu huella o rostro para acceder',
        description: 'Verificando identidad'
      });
      this.unlockApp();
      return true;
    } catch (e) {
      console.warn('Biometric verify failed or cancelled:', e);
    }
    return false;
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  }

  unlockApp() {
    this.isAuthenticated = true;
    this.updateActivity();
  }

  lockApp() {
    if (this.hasPinConfigured()) {
      this.isAuthenticated = false;
    }
  }

  // --- AUTO LOCK LOGIC ---

  updateActivity() {
    this.lastActivityTime = Date.now();
  }

  private setupInactivityTimer() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.updateActivity());
      window.addEventListener('keypress', () => this.updateActivity());
      window.addEventListener('scroll', () => this.updateActivity(), true);
      window.addEventListener('touchstart', () => this.updateActivity());

      this.inactivityInterval = setInterval(() => {
        if (this.isAuthenticated && this.hasPinConfigured()) {
          const now = Date.now();
          if (now - this.lastActivityTime > LOCK_TIMEOUT_MS) {
            this.lockApp();
          }
        }
      }, 10000); // Check every 10 seconds
    }
  }
}

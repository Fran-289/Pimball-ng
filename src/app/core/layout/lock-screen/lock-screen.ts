import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './lock-screen.html',
  styles: [`
    .numpad-btn {
      @apply w-16 h-16 sm:w-20 sm:h-20 rounded-full text-2xl font-bold bg-white/5 border border-white/10 hover:bg-accentPrimary hover:text-white transition-all flex items-center justify-center mx-auto shadow-sm;
    }
    .numpad-btn:active {
      @apply bg-accentHover scale-95;
    }
  `]
})
export class LockScreen implements OnInit {
  pin: string = '';
  errorMsg: string = '';
  biometricAvailable = false;
  biometricEnabled = false;

  constructor(public auth: AuthService) {}

  async ngOnInit() {
    this.biometricAvailable = await this.auth.isBiometricAvailable();
    this.biometricEnabled = this.auth.isBiometricEnabled();

    // Si tiene biometría activada, solicitarla inmediatamente al mostrar la pantalla
    if (this.biometricAvailable && this.biometricEnabled) {
      this.promptBiometric();
    }
  }

  appendNum(num: number) {
    if (this.pin.length < 4) {
      this.pin += num;
      this.errorMsg = '';
      if (this.pin.length === 4) {
        this.attemptUnlock();
      }
    }
  }

  async attemptUnlock() {
    if (this.pin.length !== 4) return;
    const success = await this.auth.verifyPin(this.pin);
    if (!success) {
       this.errorMsg = 'PIN incorrecto.';
       this.pin = '';
    }
  }

  deleteNum() {
    if (this.pin.length > 0) {
      this.pin = this.pin.substring(0, this.pin.length - 1);
      this.errorMsg = '';
    }
  }

  async promptBiometric() {
    await this.auth.verifyBiometric();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './core/layout/sidebar/sidebar';
import { Header } from './core/layout/header/header';
import { LockScreen } from './core/layout/lock-screen/lock-screen';
import { AuthService } from './core/services/auth.service';
import { CommonModule, Location } from '@angular/common';
import { App as CapacitorApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, LockScreen, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  isSidebarOpenMobile = false;
  isSidebarCollapsed = false;
  private lastBackPressTime = 0;
  private backButtonListener: any;

  constructor(private router: Router, private location: Location, public authService: AuthService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isSidebarOpenMobile = false;
      }
    });
  }

  ngOnInit() {
    this.setupBackButton();
    this.applyGlobalSettings();
  }

  applyGlobalSettings() {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
    // Font size
    const fontSize = localStorage.getItem('pm_font_size');
    if (fontSize === 'large') {
      document.documentElement.classList.add('text-large');
    }
  }

  ngOnDestroy() {
    if (this.backButtonListener) {
      this.backButtonListener.remove();
    }
  }

  async setupBackButton() {
    this.backButtonListener = await CapacitorApp.addListener('backButton', async () => {
      const url = this.router.url;
      if (url === '/dashboard' || url === '/') {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastBackPressTime < 2000) {
          CapacitorApp.exitApp();
        } else {
          this.lastBackPressTime = currentTime;
          await Toast.show({
            text: 'Haz doble click atrás para salir',
            duration: 'short'
          });
        }
      } else {
        this.location.back();
      }
    });
  }

  onToggleSidebar() {
    if (window.innerWidth <= 768) {
      this.isSidebarOpenMobile = !this.isSidebarOpenMobile;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  toggleSidebarMobile() {
    this.isSidebarOpenMobile = !this.isSidebarOpenMobile;
  }
}

import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './core/layout/sidebar/sidebar';
import { Header } from './core/layout/header/header';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isSidebarOpenMobile = false;
  isSidebarCollapsed = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isSidebarOpenMobile = false;
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

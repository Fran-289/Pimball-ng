import { Component, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './audit.html',
  host: {
    class: 'block w-full h-full'
  }
})
export class Audit implements OnInit {
  logs: any[] = [];
  filteredLogs: any[] = [];
  filter: string = 'all';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.logs = this.dataService.getAuditLogs() || [];
    this.applyFilter();
  }

  setFilter(f: string) {
    this.filter = f;
    this.applyFilter();
  }

  applyFilter() {
    if (this.filter === 'all') {
      this.filteredLogs = [...this.logs];
    } else {
      this.filteredLogs = this.logs.filter(log => log.module === this.filter);
    }
  }

  getModuleIcon(moduleName: string): string {
    switch (moduleName) {
      case 'Máquinas': return 'gamepad-2';
      case 'Cortes': return 'dollar-sign';
      case 'Tickets': return 'wrench';
      case 'Ubicaciones': return 'map-pin';
      default: return 'activity';
    }
  }
}

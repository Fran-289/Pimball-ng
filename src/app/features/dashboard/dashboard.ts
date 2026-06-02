import { Component, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  statMachines = 0;
  statRevenue = 0;
  statTickets = 0;
  recentActivity: any[] = [];
  private locationsMap: Record<string, string> = {};
  private machinesMap: Record<string, string> = {};

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const machines = this.dataService.getMachines();
    const cuts = this.dataService.getCuts();
    const tickets = this.dataService.getTickets();
    const locations = this.dataService.getLocations();

    locations.forEach(l => this.locationsMap[l.id] = l.name);
    machines.forEach(m => this.machinesMap[m.id] = m.id + ' - ' + m.name);

    this.statMachines = machines.filter(m => m.status === 'active').length;
    this.statRevenue = cuts.reduce((acc, cut) => acc + parseFloat(cut.ownerProfit || 0), 0);
    this.statTickets = tickets.filter(t => t.status === 'open').length;

    const cutsActivity = cuts.map(c => ({ ...c, type: 'cut', sortDate: new Date(c.date || 0) }));
    const ticketsActivity = tickets.map(t => ({ ...t, type: 'ticket', sortDate: new Date(t.createdAt || 0) }));

    this.recentActivity = [...cutsActivity, ...ticketsActivity]
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 5);
  }

  getLocationName(id: string): string {
    return this.locationsMap[id] || 'Ubicación Desconocida';
  }

  getMachineName(id: string): string {
    return this.machinesMap[id] || 'N/A';
  }
}

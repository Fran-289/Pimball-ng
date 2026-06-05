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
  statLocations = 0;
  statTickets = 0;
  recentActivity: any[] = [];
  upcomingCuts: any[] = [];
  chartData: { label: string, value: number, heightPercentage: number }[] = [];
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
    this.statLocations = locations.length;
    this.statTickets = tickets.filter(t => t.status === 'open').length;

    const cutsActivity = cuts.map(c => ({ ...c, type: 'cut', sortDate: new Date(c.date || 0) }));
    const ticketsActivity = tickets.map(t => ({ ...t, type: 'ticket', sortDate: new Date(t.createdAt || 0) }));

    this.recentActivity = [...cutsActivity, ...ticketsActivity]
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    const locMap = new Map<string, any>();
    for (const c of cuts) {
       if (!locMap.has(c.locationId) || new Date(c.date).getTime() > new Date(locMap.get(c.locationId).date).getTime()) {
           locMap.set(c.locationId, c);
       }
    }
    
    this.upcomingCuts = Array.from(locMap.values())
      .filter(c => c.nextCutDate)
      .map(c => ({
         locationId: c.locationId,
         locationName: this.getLocationName(c.locationId),
         nextCutDate: c.nextCutDate,
         sortDate: new Date(c.nextCutDate)
      }))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    // Calculate Chart Data
    const monthMap = new Map<string, number>();
    for (const c of cuts) {
       const dateObj = new Date(c.date);
       const key = `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}`;
       const val = parseFloat(c.ownerProfit || 0);
       monthMap.set(key, (monthMap.get(key) || 0) + val);
    }
    
    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    
    if (sortedMonths.length > 0) {
       const maxVal = Math.max(...sortedMonths.map(m => m[1]));
       this.chartData = sortedMonths.map(m => {
          const [year, month] = m[0].split('-');
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
          const label = dateObj.toLocaleString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase();
          return {
             label,
             value: m[1],
             heightPercentage: maxVal > 0 ? (m[1] / maxVal) * 100 : 0
          };
       });
    }
  }

  getLocationName(id: string): string {
    return this.locationsMap[id] || 'Ubicación Desconocida';
  }

  getMachineName(id: string): string {
    return this.machinesMap[id] || 'N/A';
  }
}

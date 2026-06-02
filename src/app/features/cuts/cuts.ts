import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cuts',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './cuts.html',
  styleUrl: './cuts.css',
  host: {
    class: 'block w-full h-full'
  }
})
export class Cuts implements OnInit {
  cuts: any[] = [];
  locations: any[] = [];
  isModalOpen = false;
  
  groupedByLocation: any[] = [];

  formCut = {
    locationId: '',
    grossIncome: null as number | null,
    expenses: null as number | null,
    netIncome: 0,
    ownerPercentage: 50,
    ownerProfit: 0,
    locationProfit: 0,
    date: '',
    nextCutDate: ''
  };

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.cuts = this.dataService.getCuts().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.locations = this.dataService.getLocations();
    this.buildGroupedHistory();
    this.cdr.detectChanges();
  }

  buildGroupedHistory() {
    const locMap = new Map<string, any>();

    for (const cut of this.cuts) {
      const locId = cut.locationId;
      if (!locMap.has(locId)) {
        locMap.set(locId, {
          locationId: locId,
          locationName: this.getLocationName(locId),
          totalProfit: 0,
          monthsMap: new Map<string, any>()
        });
      }
      
      const locData = locMap.get(locId);
      const dateObj = new Date(cut.date);
      // Create a key like "2026-06"
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (!locData.monthsMap.has(monthKey)) {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        locData.monthsMap.set(monthKey, {
          monthKey,
          monthName: `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`,
          totalGross: 0,
          totalExpenses: 0,
          totalOwnerProfit: 0,
          cuts: []
        });
      }

      const monthData = locData.monthsMap.get(monthKey);
      monthData.cuts.push(cut);
      monthData.totalGross += Number(cut.grossIncome) || 0;
      monthData.totalExpenses += Number(cut.expenses) || 0;
      monthData.totalOwnerProfit += Number(cut.ownerProfit) || 0;
      
      locData.totalProfit += Number(cut.ownerProfit) || 0;
    }

    // Convert Maps to Arrays
    this.groupedByLocation = Array.from(locMap.values()).map(loc => {
      return {
        ...loc,
        months: Array.from(loc.monthsMap.values()).sort((a: any, b: any) => b.monthKey.localeCompare(a.monthKey)) // Sort months descending
      };
    }).sort((a, b) => a.locationName.localeCompare(b.locationName));
  }

  getLocationName(id: string): string {
    const loc = this.locations.find(l => l.id === id);
    return loc ? loc.name : 'Desconocida';
  }

  openModal() {
    this.formCut = {
      locationId: this.locations.length > 0 ? this.locations[0].id : '',
      grossIncome: null,
      expenses: null,
      netIncome: 0,
      ownerPercentage: 50,
      ownerProfit: 0,
      locationProfit: 0,
      date: new Date().toISOString().split('T')[0],
      nextCutDate: ''
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  calculateProfits() {
    const gross = Number(this.formCut.grossIncome) || 0;
    const expenses = Number(this.formCut.expenses) || 0;
    const percent = Number(this.formCut.ownerPercentage) || 0;
    
    this.formCut.netIncome = Math.max(0, gross - expenses);
    this.formCut.ownerProfit = (this.formCut.netIncome * percent) / 100;
    this.formCut.locationProfit = this.formCut.netIncome - this.formCut.ownerProfit;
  }

  saveCut() {
    if (!this.formCut.locationId) {
      alert('Debes seleccionar una ubicación.');
      return;
    }
    if (this.formCut.grossIncome === null || this.formCut.grossIncome < 0) {
      alert('Debes ingresar un Subtotal válido.');
      return;
    }
    
    this.dataService.addCut({
      ...this.formCut,
      grossIncome: Number(this.formCut.grossIncome) || 0,
      expenses: Number(this.formCut.expenses) || 0
    });
    this.loadData();
    this.closeModal();
  }
}

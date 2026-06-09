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
  machines: any[] = [];
  isModalOpen = false;
  isEditMode = false;
  isLocationLocked = false;
  editingCutId = '';
  editReason = '';
  
  groupedByLocation: any[] = [];
  activeLocation: any = null; // null means showing all cards. Otherwise, it contains the locData object.

  globalTotalGross = 0;
  globalTotalProfit = 0;
  globalMonthGross = 0;
  globalMonthProfit = 0;
  currentMonthName = '';
  globalMonths: any[] = [];
  globalYears: any[] = [];

  formMachineCuts: { machineId: string; name: string; amount: number | null }[] = [];

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
    this.machines = this.dataService.getMachines();
    this.buildGroupedHistory();
    this.cdr.detectChanges();
  }

  buildGroupedHistory() {
    this.globalTotalGross = 0;
    this.globalTotalProfit = 0;
    this.globalMonthGross = 0;
    this.globalMonthProfit = 0;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.currentMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const locMap = new Map<string, any>();
    const globMonthsMap = new Map<string, any>();
    const globYearsMap = new Map<string, any>();

    // Inicializar solo las ubicaciones que tienen al menos una máquina asignada
    const activeLocationsIds = new Set(this.machines.map(m => m.locationId));
    
    for (const loc of this.locations) {
      if (activeLocationsIds.has(loc.id)) {
        locMap.set(loc.id, {
          locationId: loc.id,
          locationName: loc.name,
          totalProfit: 0,
          monthsMap: new Map<string, any>(),
          lastCut: null,
          nextCutDate: null
        });
      }
    }

    for (const cut of this.cuts) {
      const locId = cut.locationId;
      if (!locMap.has(locId)) {
        locMap.set(locId, {
          locationId: locId,
          locationName: this.getLocationName(locId),
          totalProfit: 0,
          monthsMap: new Map<string, any>(),
          lastCut: null,
          nextCutDate: null
        });
      }
      
      const locData = locMap.get(locId);
      const dateObj = new Date(cut.date);
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
      
      if (!cut.isCancelled) {
        monthData.totalGross += Number(cut.grossIncome) || 0;
        monthData.totalExpenses += Number(cut.expenses) || 0;
        monthData.totalOwnerProfit += Number(cut.ownerProfit) || 0;
        
        locData.totalProfit += Number(cut.ownerProfit) || 0;

        // Global aggregations
        this.globalTotalGross += Number(cut.grossIncome) || 0;
        this.globalTotalProfit += Number(cut.ownerProfit) || 0;
        if (monthKey === currentMonthKey) {
          this.globalMonthGross += Number(cut.grossIncome) || 0;
          this.globalMonthProfit += Number(cut.ownerProfit) || 0;
        }
        
        if (!globMonthsMap.has(monthKey)) {
          globMonthsMap.set(monthKey, {
            monthKey,
            monthName: `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`,
            totalGross: 0,
            totalOwnerProfit: 0
          });
        }
        const gMonth = globMonthsMap.get(monthKey);
        gMonth.totalGross += Number(cut.grossIncome) || 0;
        gMonth.totalOwnerProfit += Number(cut.ownerProfit) || 0;
        
        const yearKey = `${dateObj.getFullYear()}`;
        if (!globYearsMap.has(yearKey)) {
          globYearsMap.set(yearKey, {
            year: yearKey,
            totalGross: 0,
            totalOwnerProfit: 0
          });
        }
        const gYear = globYearsMap.get(yearKey);
        gYear.totalGross += Number(cut.grossIncome) || 0;
        gYear.totalOwnerProfit += Number(cut.ownerProfit) || 0;
        
        // Keep track of the most recent cut for the location card (only active cuts)
        if (!locData.lastCut || new Date(cut.date).getTime() > new Date(locData.lastCut.date).getTime()) {
          locData.lastCut = cut;
          if (cut.nextCutDate) {
            locData.nextCutDate = cut.nextCutDate;
          }
        }
      }
    }

    this.groupedByLocation = Array.from(locMap.values()).map(loc => {
      // Ordenar los cortes dentro de cada mes de forma descendente (más reciente primero)
      Array.from(loc.monthsMap.values()).forEach((month: any) => {
        month.cuts.sort((a: any, b: any) => {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (diff === 0) {
            return (b.displayId || '').localeCompare(a.displayId || '');
          }
          return diff;
        });
      });

      return {
        ...loc,
        months: Array.from(loc.monthsMap.values()).sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey))
      };
    }).sort((a, b) => a.locationName.localeCompare(b.locationName));
    
    this.globalMonths = Array.from(globMonthsMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    this.globalYears = Array.from(globYearsMap.values()).sort((a, b) => b.year.localeCompare(a.year)); // Newer years first

    // Refresh activeLocation reference if it's currently open
    if (this.activeLocation) {
      this.activeLocation = this.groupedByLocation.find(l => l.locationId === this.activeLocation.locationId) || null;
    }
  }

  getLocationName(id: string): string {
    const loc = this.locations.find(l => l.id === id);
    return loc ? loc.name : 'Desconocida';
  }

  getMachineName(id: string): string {
    const m = this.machines.find(mac => mac.id === id);
    return m ? `${m.id} - ${m.name}` : id;
  }

  viewLocationHistory(loc: any) {
    this.activeLocation = loc;
  }

  backToCards() {
    this.activeLocation = null;
  }

  openModal() {
    this.openLocationSpecificModal('');
  }

  openLocationSpecificModal(locationId: string) {
    this.isEditMode = false;
    this.isLocationLocked = locationId ? true : false;
    this.editingCutId = '';
    this.editReason = '';

    const defaultLocId = locationId || (this.locations.length > 0 ? this.locations[0].id : '');
    this.formCut = {
      locationId: defaultLocId,
      grossIncome: 0,
      expenses: null,
      netIncome: 0,
      ownerPercentage: 50,
      ownerProfit: 0,
      locationProfit: 0,
      date: new Date().toISOString().split('T')[0],
      nextCutDate: ''
    };
    this.onLocationChange(); // Populate machines for default location
    this.isModalOpen = true;
  }

  editCut(cut: any) {
    this.isEditMode = true;
    this.editingCutId = cut.id;
    this.editReason = '';
    
    this.formCut = {
      locationId: cut.locationId,
      grossIncome: cut.grossIncome,
      expenses: cut.expenses,
      netIncome: cut.netIncome,
      ownerPercentage: cut.ownerPercentage,
      ownerProfit: cut.ownerProfit,
      locationProfit: cut.locationProfit,
      date: new Date(cut.date).toISOString().split('T')[0],
      nextCutDate: cut.nextCutDate ? new Date(cut.nextCutDate).toISOString().split('T')[0] : ''
    };

    // Reconstruct machine details
    this.onLocationChange();
    if (cut.machineDetails) {
      for (const md of cut.machineDetails) {
        const match = this.formMachineCuts.find(mc => mc.machineId === md.machineId);
        if (match) match.amount = md.amount;
      }
    }
    
    this.isModalOpen = true;
  }

  canDeleteCut(cut: any): boolean {
    return !cut.isCancelled;
  }

  deleteCut(cut: any) {
    if (!this.canDeleteCut(cut)) return;
    
    const reason = prompt('Razón para anular este corte:');
    if (reason && reason.trim() !== '') {
      this.dataService.cancelCut(cut.id, reason.trim());
      this.loadData();
    } else if (reason !== null) {
      alert('Debes ingresar una razón para anular el corte.');
    }
  }

  deleteLocation(locationId: string) {
    const locMachines = this.machines.filter(m => m.locationId === locationId);
    if (locMachines.length > 0) {
      alert(`No puedes eliminar esta ubicación porque tiene ${locMachines.length} máquina(s) asignada(s) en el Inventario. Elimina o reasigna las máquinas primero.`);
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta ubicación por completo?')) {
      const reason = prompt('Razón de la eliminación:');
      if (reason !== null) {
        this.dataService.deleteLocation(locationId, reason || 'No especificada');
        this.backToCards();
        this.loadData();
      }
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onLocationChange() {
    const locId = this.formCut.locationId;
    // Find all machines assigned to this location
    const locMachines = this.machines.filter(m => m.locationId === locId);
    
    this.formMachineCuts = locMachines.map(m => ({
      machineId: m.id,
      name: m.name,
      amount: null
    }));
    
    this.calculateProfits();
  }

  onMachineAmountChange() {
    // Sum all machine amounts to get the total gross income
    let totalGross = 0;
    for (const mc of this.formMachineCuts) {
      totalGross += Number(mc.amount) || 0;
    }
    this.formCut.grossIncome = totalGross;
    this.calculateProfits();
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
    if (!this.formCut.nextCutDate) {
      alert('La fecha del siguiente corte es obligatoria.');
      return;
    }
    
    // Save the detailed breakdown inside the cut object
    const machineDetails = this.formMachineCuts.map(mc => ({
      machineId: mc.machineId,
      amount: Number(mc.amount) || 0
    })).filter(mc => mc.amount > 0); // Only save non-zero entries to save space if needed
    
    if (this.isEditMode) {
      this.dataService.updateCut(this.editingCutId, {
        ...this.formCut,
        grossIncome: Number(this.formCut.grossIncome) || 0,
        expenses: Number(this.formCut.expenses) || 0,
        machineDetails: machineDetails
      }, this.editReason);
    } else {
      this.dataService.addCut({
        ...this.formCut,
        grossIncome: Number(this.formCut.grossIncome) || 0,
        expenses: Number(this.formCut.expenses) || 0,
        machineDetails: machineDetails
      });
    }
    
    this.loadData();
    this.closeModal();
  }
}

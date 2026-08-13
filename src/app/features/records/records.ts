import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, TranslatePipe],
  templateUrl: './records.html',
  host: {
    class: 'block w-full h-full'
  }
})
export class Records implements OnInit {
  cuts: any[] = [];
  
  globalTotalGross = 0;
  globalTotalProfit = 0;
  globalMonthGross = 0;
  globalMonthProfit = 0;
  globalMonths: any[] = [];
  globalYears: any[] = [];
  
  isMonthlyModalOpen = false;
  isYearlyModalOpen = false;

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.cuts = this.dataService.getCuts().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.buildGlobalHistory();
    this.cdr.detectChanges();
  }

  buildGlobalHistory() {
    this.globalTotalGross = 0;
    this.globalTotalProfit = 0;
    this.globalMonthGross = 0;
    this.globalMonthProfit = 0;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const globMonthsMap = new Map<string, any>();
    const globYearsMap = new Map<string, any>();

    for (const cut of this.cuts) {
      if (cut.isCancelled) continue; // Ignore cancelled cuts

      const dateObj = new Date(cut.date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
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
    }

    this.globalMonths = Array.from(globMonthsMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Newer months first
    this.globalYears = Array.from(globYearsMap.values()).sort((a, b) => b.year.localeCompare(a.year)); // Newer years first
  }
}

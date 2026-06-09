import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './backups.html',
  styleUrl: './backups.css',
})
export class Backups {
  constructor(private dataService: DataService, private exportService: ExportService) {}

  exportBackup() {
    const backup = this.dataService.getFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    this.exportService.downloadJSON(backup, `pinball_backup_${dateStr}`);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        let successCount = 0;
        
        if (data.machines) { this.dataService.restoreData('machines', data.machines); successCount++; }
        if (data.locations) { this.dataService.restoreData('locations', data.locations); successCount++; }
        if (data.cuts) { this.dataService.restoreData('cuts', data.cuts); successCount++; }
        if (data.tickets) { this.dataService.restoreData('tickets', data.tickets); successCount++; }
        if (data.audit) { this.dataService.restoreData('audit', data.audit); successCount++; }
        if (data.user) { this.dataService.restoreData('user', data.user); successCount++; }

        if (successCount > 0) {
          alert('¡Respaldo restaurado exitosamente! La página se recargará para aplicar los cambios.');
          window.location.reload();
        } else {
          alert('El archivo no contiene un formato válido para PinballPro.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  triggerFileInput() {
    document.getElementById('import-file')?.click();
  }

  // EXPORT TO EXCEL / CSV
  exportMachinesCsv() {
    const machines = this.dataService.getMachines();
    const headers = ['ID', 'Nombre', 'Tipo', 'UbicacionID', 'Estado', 'Notas'];
    const mapRow = (m: any) => [m.id, m.name, m.type, m.locationId, m.status, m.notes];
    this.exportService.downloadCSV(machines, 'Inventario_Maquinas', headers, mapRow);
  }

  exportCutsCsv() {
    const cuts = this.dataService.getCuts();
    const headers = ['ID_Corte', 'Fecha', 'UbicacionID', 'Ingreso Bruto', 'Gastos', 'Ingreso Neto', 'Ganancia Propietario', 'Ganancia Local'];
    const mapRow = (c: any) => [c.displayId, c.date, c.locationId, c.grossIncome, c.expenses, c.netIncome, c.ownerProfit, c.locationProfit];
    this.exportService.downloadCSV(cuts, 'Reporte_Cortes', headers, mapRow);
  }

  exportTicketsCsv() {
    const tickets = this.dataService.getTickets();
    const headers = ['ID_Ticket', 'Fecha_Creacion', 'MaquinaID', 'Titulo', 'Estado', 'Prioridad', 'Notas'];
    const mapRow = (t: any) => [t.id, t.createdAt, t.machineId, t.title, t.status, t.priority, t.notes ? t.notes.length + ' notas' : '0'];
    this.exportService.downloadCSV(tickets, 'Reporte_Reparaciones', headers, mapRow);
  }

  exportAuditCsv() {
    const logs = this.dataService.getAuditLogs();
    const headers = ['ID', 'Fecha', 'Accion', 'Modulo', 'Detalles', 'Cambios_Especificos'];
    const mapRow = (l: any) => [
      l.id, 
      l.date, 
      l.action, 
      l.module, 
      l.details, 
      l.changes ? l.changes.map((c: any) => `${c.field}: ${c.old} -> ${c.new}`).join(' | ') : 'N/A'
    ];
    this.exportService.downloadCSV(logs, 'Reporte_Auditoria', headers, mapRow);
  }
}

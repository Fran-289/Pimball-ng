import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { SecurityService } from '../../core/services/security.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, TranslatePipe],
  templateUrl: './backups.html',
  styleUrl: './backups.css',
})
export class Backups {
  constructor(
    private dataService: DataService,
    private exportService: ExportService,
    private securityService: SecurityService
  ) {}

  exportBackup() {
    const backup = this.dataService.getFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    this.exportService.downloadJSON(backup, `pinball_backup_${dateStr}`);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('⚠️ Solo se aceptan archivos con extensión .json');
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      alert('⚠️ El archivo es demasiado grande. Máximo permitido: 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const rawData = JSON.parse(e.target.result);
        const validation = this.securityService.validateBackupData(rawData);

        if (validation.errors.length > 0) {
          const errorMsg = validation.errors.slice(0, 5).join('\n');
          alert(`⚠️ El archivo contiene datos inválidos:\n\n${errorMsg}\n\n${validation.errors.length > 5 ? `...y ${validation.errors.length - 5} errores más.` : ''}\nSe restaurarán solo los datos válidos.`);
        }

        if (!validation.sanitized) {
          alert('❌ El archivo no contiene un formato válido para PinballPro. La restauración fue cancelada.');
          return;
        }

        const confirmed = confirm(
          '⚠️ ADVERTENCIA DE SEGURIDAD\n\n' +
          'Al restaurar un respaldo se sobreescribirán los datos actuales.\n' +
          'Los registros de auditoría se FUSIONARÁN (no se borran).\n\n' +
          '¿Deseas continuar con la restauración?'
        );

        if (!confirmed) return;

        let successCount = 0;
        const sanitized = validation.sanitized;

        if (sanitized['machines']) { this.dataService.restoreData('machines', sanitized['machines'] as any[]); successCount++; }
        if (sanitized['locations']) { this.dataService.restoreData('locations', sanitized['locations'] as any[]); successCount++; }
        if (sanitized['cuts']) { this.dataService.restoreData('cuts', sanitized['cuts'] as any[]); successCount++; }
        if (sanitized['tickets']) { this.dataService.restoreData('tickets', sanitized['tickets'] as any[]); successCount++; }
        if (sanitized['user']) { this.dataService.restoreData('user', sanitized['user'] as any[]); successCount++; }

        if (sanitized['audit']) {
          this.dataService.mergeAuditLogs(sanitized['audit'] as any[]);
          successCount++;
        }

        this.dataService.addAuditLog(
          'Restaurar',
          'Sistema',
          `Se restauró un respaldo del sistema (${successCount} módulos). Archivo: ${this.securityService.sanitizeString(file.name, 100)}`
        );

        if (successCount > 0) {
          alert(`✅ ¡Respaldo restaurado exitosamente!\n${successCount} módulo(s) restaurados.\nLa página se recargará para aplicar los cambios.`);
          window.location.reload();
        } else {
          alert('❌ No se pudieron restaurar datos del archivo.');
        }
      } catch (err) {
        alert('❌ Error al leer el archivo JSON. Verifica que sea un archivo de respaldo válido.');
        console.error('[Backups] Error de restauración:', err);
      }
    };
    reader.readAsText(file);

    event.target.value = '';
  }

  triggerFileInput() {
    document.getElementById('import-file')?.click();
  }

  // EXPORT FUNCTIONS

  exportMachines(format: 'excel' | 'pdf') {
    const machines = this.dataService.getMachines();
    const headers = ['ID', 'Nombre', 'Tipo', 'UbicacionID', 'Estado', 'Notas'];
    const mapRow = (m: any) => [m.id, m.name, m.type, m.locationId, m.status, m.notes || ''];
    if (format === 'excel') this.exportService.downloadExcel(machines, 'Inventario_Maquinas', 'INVENTARIO DE MÁQUINAS', headers, mapRow);
    else this.exportService.downloadPDF(machines, 'Inventario_Maquinas', 'INVENTARIO DE MÁQUINAS', headers, mapRow);
  }

  exportCuts(format: 'excel' | 'pdf') {
    const cuts = this.dataService.getCuts();
    const headers = ['ID_Corte', 'Fecha', 'UbicacionID', 'Ingreso Bruto', 'Gastos', 'Ingreso Neto', 'Ganancia Propietario', 'Ganancia Local'];
    const mapRow = (c: any) => [c.displayId, c.date, c.locationId, c.grossIncome, c.expenses, c.netIncome, c.ownerProfit, c.locationProfit];
    if (format === 'excel') this.exportService.downloadExcel(cuts, 'Reporte_Cortes', 'REPORTE DE CORTES', headers, mapRow);
    else this.exportService.downloadPDF(cuts, 'Reporte_Cortes', 'REPORTE DE CORTES', headers, mapRow);
  }

  exportTickets(format: 'excel' | 'pdf') {
    const tickets = this.dataService.getTickets();
    const headers = ['ID_Ticket', 'Fecha_Creacion', 'MaquinaID', 'Titulo', 'Estado', 'Prioridad', 'Notas'];
    const mapRow = (t: any) => [t.id, t.createdAt, t.machineId, t.title, t.status, t.priority, t.notes ? t.notes.length + ' notas' : '0'];
    if (format === 'excel') this.exportService.downloadExcel(tickets, 'Reporte_Reparaciones', 'REPORTE DE REPARACIONES', headers, mapRow);
    else this.exportService.downloadPDF(tickets, 'Reporte_Reparaciones', 'REPORTE DE REPARACIONES', headers, mapRow);
  }

  exportAudit(format: 'excel' | 'pdf') {
    const logs = this.dataService.getAuditLogs();
    const headers = ['ID', 'Fecha', 'Accion', 'Modulo', 'Detalles'];
    const mapRow = (l: any) => [l.id, l.date, l.action, l.module, l.details];
    if (format === 'excel') this.exportService.downloadExcel(logs, 'Reporte_Auditoria', 'REGISTROS DE AUDITORÍA', headers, mapRow);
    else this.exportService.downloadPDF(logs, 'Reporte_Auditoria', 'REGISTROS DE AUDITORÍA', headers, mapRow);
  }
}

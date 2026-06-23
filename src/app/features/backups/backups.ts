import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { SecurityService } from '../../core/services/security.service';
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

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('⚠️ Solo se aceptan archivos con extensión .json');
      return;
    }

    // Validate file size (max 10MB to prevent abuse)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      alert('⚠️ El archivo es demasiado grande. Máximo permitido: 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const rawData = JSON.parse(e.target.result);

        // ── SECURITY: Validate backup structure before restoring ──
        const validation = this.securityService.validateBackupData(rawData);

        if (validation.errors.length > 0) {
          const errorMsg = validation.errors.slice(0, 5).join('\n');
          alert(`⚠️ El archivo contiene datos inválidos:\n\n${errorMsg}\n\n${validation.errors.length > 5 ? `...y ${validation.errors.length - 5} errores más.` : ''}\nSe restaurarán solo los datos válidos.`);
        }

        if (!validation.sanitized) {
          alert('❌ El archivo no contiene un formato válido para PinballPro. La restauración fue cancelada.');
          return;
        }

        // ── DOUBLE CONFIRMATION ──
        const confirmed = confirm(
          '⚠️ ADVERTENCIA DE SEGURIDAD\n\n' +
          'Al restaurar un respaldo se sobreescribirán los datos actuales.\n' +
          'Los registros de auditoría se FUSIONARÁN (no se borran).\n\n' +
          '¿Deseas continuar con la restauración?'
        );

        if (!confirmed) return;

        // ── RESTORE with sanitized data ──
        let successCount = 0;
        const sanitized = validation.sanitized;

        if (sanitized['machines']) { this.dataService.restoreData('machines', sanitized['machines'] as any[]); successCount++; }
        if (sanitized['locations']) { this.dataService.restoreData('locations', sanitized['locations'] as any[]); successCount++; }
        if (sanitized['cuts']) { this.dataService.restoreData('cuts', sanitized['cuts'] as any[]); successCount++; }
        if (sanitized['tickets']) { this.dataService.restoreData('tickets', sanitized['tickets'] as any[]); successCount++; }
        if (sanitized['user']) { this.dataService.restoreData('user', sanitized['user'] as any[]); successCount++; }

        // ── AUDIT LOGS: Merge instead of overwrite ──
        if (sanitized['audit']) {
          this.dataService.mergeAuditLogs(sanitized['audit'] as any[]);
          successCount++;
        }

        // ── Log the restore action in audit ──
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

    // Reset the file input so the same file can be selected again
    event.target.value = '';
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

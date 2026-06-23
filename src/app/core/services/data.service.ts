import { Injectable, EventEmitter } from '@angular/core';
import { SecurityService } from './security.service';

const STORE_KEYS = {
  MACHINES: 'pm_machines',
  LOCATIONS: 'pm_locations',
  CUTS: 'pm_cuts',
  TICKETS: 'pm_tickets',
  USER: 'pm_user',
  AUDIT: 'pm_audit'
};

@Injectable({
  providedIn: 'root'
})
export class DataService {

  dataChanged = new EventEmitter<void>();

  /** Tracks if any data integrity violation has been detected */
  private integrityViolationDetected = false;

  constructor(private security: SecurityService) {
    this.initStore();
  }

  // ─── INTEGRITY STATUS ─────────────────────────────────────────────

  hasIntegrityViolation(): boolean {
    return this.integrityViolationDetected;
  }

  /**
   * Verify integrity of all stored data.
   * If any module fails checksum, flag it.
   */
  async verifyAllIntegrity(): Promise<{ module: string; valid: boolean }[]> {
    const results: { module: string; valid: boolean }[] = [];
    for (const [name, key] of Object.entries(STORE_KEYS)) {
      const { isValid } = await this.security.getWithChecksum(key);
      results.push({ module: name, valid: isValid });
      if (!isValid) {
        this.integrityViolationDetected = true;
        console.warn(`[DataService] ⚠️ Integridad comprometida en: ${name}`);
      }
    }
    return results;
  }

  // ─── CORE STORAGE (with checksums) ────────────────────────────────

  private getStore(key: string): any[] {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private setStore(key: string, data: any[]): void {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    // Fire-and-forget checksum update
    this.security.setWithChecksum(key, json).catch(() => {});
  }

  private generateId(): string {
    return this.security.generateSecureId();
  }

  private initStore() {
    if (!localStorage.getItem(STORE_KEYS.LOCATIONS)) {
      this.setStore(STORE_KEYS.LOCATIONS, [
        { id: 'loc_1', name: 'Bar El Arcade' },
        { id: 'loc_2', name: 'Centro Comercial Norte' }
      ]);
    }
    if (!localStorage.getItem(STORE_KEYS.MACHINES)) {
      this.setStore(STORE_KEYS.MACHINES, []);
    }
    if (!localStorage.getItem(STORE_KEYS.USER)) {
      this.setStore(STORE_KEYS.USER, [{
        name: 'Administrador',
        email: 'admin@pinball.pro',
        photo: 'mascot.png'
      }]);
    }
    if (!localStorage.getItem(STORE_KEYS.AUDIT)) {
      this.setStore(STORE_KEYS.AUDIT, []);
    }
  }

  // --- AUDIT ---
  getAuditLogs(): any[] {
    return this.getStore(STORE_KEYS.AUDIT);
  }

  addAuditLog(action: string, module: string, details: string, changes?: { field: string, old: any, new: any }[]): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: this.generateId(),
      date: new Date().toISOString(),
      action: this.security.sanitizeString(action, 50),
      module: this.security.sanitizeString(module, 50),
      details: this.security.sanitizeString(details, 500),
      changes
    });
    this.setStore(STORE_KEYS.AUDIT, logs);
  }

  private translateStatus(s: string): string {
    switch(s) {
      case 'active': return 'Activa';
      case 'inactive': return 'Inactiva';
      case 'repair': return 'En Reparación';
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'closed': return 'Cerrado';
      default: return s;
    }
  }

  // --- USER PROFILE ---
  getUserProfile(): any {
    const users = this.getStore(STORE_KEYS.USER);
    return users.length > 0 ? users[0] : { name: 'Admin', email: '', photo: 'mascot.png' };
  }

  saveUserProfile(profile: any): void {
    const sanitizedProfile = {
      name: this.security.sanitizeString(profile.name, 100),
      email: this.security.sanitizeString(profile.email, 200),
      photo: this.security.sanitizeDataUrl(profile.photo)
    };
    this.setStore(STORE_KEYS.USER, [sanitizedProfile]);
  }

  // --- MACHINES ---
  getMachines(): any[] {
    return this.getStore(STORE_KEYS.MACHINES);
  }

  addMachine(machine: any): void {
    const machines = this.getMachines();
    let nextNum = 1;
    if (machines.length > 0) {
      const nums = machines.map(m => {
        const idParts = String(m.id).split('-');
        return parseInt(idParts[1]) || 0;
      });
      nums.sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] > nextNum) break;
        if (nums[i] === nextNum) nextNum++;
      }
    }
    const id = 'M-' + String(nextNum).padStart(2, '0');
    const sanitized = {
      ...machine,
      id: id,
      name: this.security.sanitizeString(machine.name, 100),
      type: this.security.sanitizeString(machine.type, 50),
      notes: this.security.sanitizeString(machine.notes, 500),
      photo: this.security.sanitizeDataUrl(machine.photo),
      estimatedCost: this.security.sanitizeNumber(machine.estimatedCost, 0, 999999),
      createdAt: new Date().toISOString()
    };
    machines.push(sanitized);
    this.setStore(STORE_KEYS.MACHINES, machines);
    this.addAuditLog('Crear', 'Máquinas', `Se registró la máquina ${id} - ${sanitized.name}`);
  }

  updateMachine(id: string, updates: any, reason?: string): void {
    let changes: any[] = [];
    const sanitizedUpdates = {
      ...updates,
      name: this.security.sanitizeString(updates.name, 100),
      type: this.security.sanitizeString(updates.type, 50),
      notes: this.security.sanitizeString(updates.notes, 500),
      photo: this.security.sanitizeDataUrl(updates.photo),
      estimatedCost: this.security.sanitizeNumber(updates.estimatedCost, 0, 999999)
    };
    const machines = this.getMachines().map(m => {
      if (m.id === id) {
        if (m.name !== sanitizedUpdates.name) changes.push({ field: 'Nombre', old: m.name, new: sanitizedUpdates.name });
        if (m.status !== sanitizedUpdates.status) changes.push({ field: 'Estado', old: this.translateStatus(m.status), new: this.translateStatus(sanitizedUpdates.status) });
        if (m.locationId !== sanitizedUpdates.locationId) changes.push({ field: 'Ubicación', old: m.locationId, new: sanitizedUpdates.locationId });
        if (m.estimatedCost !== sanitizedUpdates.estimatedCost) changes.push({ field: 'Costo', old: m.estimatedCost || 0, new: sanitizedUpdates.estimatedCost || 0 });
        return { ...m, ...sanitizedUpdates };
      }
      return m;
    });
    this.setStore(STORE_KEYS.MACHINES, machines);
    if (changes.length > 0) {
      const autoReason = changes.map(ch => `Cambio de ${ch.field} a ${ch.new}`).join(', ');
      const finalReason = reason || autoReason;
      this.addAuditLog('Editar', 'Máquinas', `Se editó la máquina ${id}. ${finalReason}`, changes);
    }
  }

  deleteMachine(id: string, reason?: string): void {
    const machines = this.getMachines().filter(m => m.id !== id);
    this.setStore(STORE_KEYS.MACHINES, machines);
    this.addAuditLog('Eliminar', 'Máquinas', `Se eliminó la máquina ${id}${reason ? '. Razón: ' + this.security.sanitizeString(reason, 200) : ''}`);
  }

  // --- LOCATIONS ---
  getLocations(): any[] {
    return this.getStore(STORE_KEYS.LOCATIONS);
  }

  addLocation(name: string): string {
    const locations = this.getLocations();
    const id = 'loc_' + this.generateId().substring(0, 9);
    const sanitizedName = this.security.sanitizeString(name, 100);
    locations.push({ id, name: sanitizedName });
    this.setStore(STORE_KEYS.LOCATIONS, locations);
    this.addAuditLog('Crear', 'Ubicaciones', `Se registró la ubicación ${sanitizedName}`);
    return id;
  }

  // --- CUTS ---
  getCuts(): any[] {
    return this.getStore(STORE_KEYS.CUTS);
  }

  addCut(cut: any): void {
    const cuts = this.getCuts();
    const locCuts = cuts.filter(c => c.locationId === cut.locationId);
    let nextNum = 1;
    if (locCuts.length > 0) {
      const nums = locCuts.map(c => {
        const parts = String(c.displayId || '').split('-');
        return parseInt(parts[1]) || 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const displayId = 'C-' + String(nextNum).padStart(3, '0');
    const sanitizedCut = {
      ...cut,
      id: this.generateId(),
      displayId: displayId,
      grossIncome: this.security.sanitizeNumber(cut.grossIncome, 0, 999999999),
      expenses: this.security.sanitizeNumber(cut.expenses, 0, 999999999),
      netIncome: this.security.sanitizeNumber(cut.netIncome, 0, 999999999),
      ownerPercentage: this.security.sanitizeNumber(cut.ownerPercentage, 0, 100),
      ownerProfit: this.security.sanitizeNumber(cut.ownerProfit, 0, 999999999),
      locationProfit: this.security.sanitizeNumber(cut.locationProfit, 0, 999999999),
      date: cut.date || new Date().toISOString()
    };
    cuts.push(sanitizedCut);
    this.setStore(STORE_KEYS.CUTS, cuts);
    this.addAuditLog('Crear', 'Cortes', `Se generó el corte ${displayId} por ${sanitizedCut.grossIncome}`);
    this.dataChanged.emit();
  }

  updateCut(id: string, updates: any, editReason?: string): void {
    let changes: any[] = [];
    let savedReason = '';
    const cuts = this.getCuts().map(c => {
      if (c.id === id) {
        let history = c.editHistory || [];

        const sanitizedGross = this.security.sanitizeNumber(updates.grossIncome, 0, 999999999);
        const sanitizedExpenses = this.security.sanitizeNumber(updates.expenses, 0, 999999999);
        const sanitizedPercentage = this.security.sanitizeNumber(updates.ownerPercentage, 0, 100);
        
        if (c.grossIncome !== sanitizedGross) {
          changes.push({ field: 'Subtotal', old: c.grossIncome, new: sanitizedGross });
        }
        if (c.expenses !== sanitizedExpenses) {
          changes.push({ field: 'Gastos', old: c.expenses || 0, new: sanitizedExpenses });
        }
        if (c.ownerPercentage !== sanitizedPercentage) {
          changes.push({ field: '% Ganancia', old: c.ownerPercentage, new: sanitizedPercentage });
        }
        
        if (changes.length > 0) {
          const autoReason = changes.map(ch => `Cambio de ${ch.field} a ${ch.new}`).join(', ');
          savedReason = editReason || autoReason;
          
          history.push({
            date: new Date().toISOString(),
            reason: this.security.sanitizeString(savedReason, 500),
            previousGross: c.grossIncome,
            previousNet: c.netIncome
          });
        }
        
        return {
          ...c,
          ...updates,
          grossIncome: sanitizedGross,
          expenses: sanitizedExpenses,
          ownerPercentage: sanitizedPercentage,
          editHistory: history
        };
      }
      return c;
    });
    this.setStore(STORE_KEYS.CUTS, cuts);
    if (changes.length > 0) {
      this.addAuditLog('Editar', 'Cortes', `Se editó el corte. ${savedReason}`, changes);
    }
    this.dataChanged.emit();
  }

  cancelCut(id: string, reason: string): void {
    const sanitizedReason = this.security.sanitizeString(reason, 500);
    const cuts = this.getCuts().map(c => {
      if (c.id === id) {
        return { 
          ...c, 
          isCancelled: true, 
          cancelReason: sanitizedReason 
        };
      }
      return c;
    });
    this.setStore(STORE_KEYS.CUTS, cuts);
    this.addAuditLog('Anular', 'Cortes', `Se anuló un corte del historial. Razón: ${sanitizedReason}`);
    this.dataChanged.emit();
  }

  deleteLocation(id: string, reason?: string): void {
    const locations = this.getLocations().filter(l => l.id !== id);
    this.setStore(STORE_KEYS.LOCATIONS, locations);
    this.addAuditLog('Eliminar', 'Ubicaciones', `Se eliminó una ubicación${reason ? '. Razón: ' + this.security.sanitizeString(reason, 200) : ''}`);
  }

  // --- TICKETS ---
  getTickets(): any[] {
    return this.getStore(STORE_KEYS.TICKETS);
  }

  addTicket(ticket: any): void {
    const tickets = this.getTickets();
    const id = this.generateId();
    const sanitizedTicket = {
      ...ticket,
      id: id,
      title: this.security.sanitizeString(ticket.title, 200),
      description: this.security.sanitizeString(ticket.description, 1000),
      status: 'open',
      createdAt: new Date().toISOString(),
      notes: []
    };
    tickets.push(sanitizedTicket);
    this.setStore(STORE_KEYS.TICKETS, tickets);
    this.addAuditLog('Crear', 'Tickets', `Se abrió el ticket de reparación para la máquina ${ticket.machineId}`);
  }

  updateTicketStatus(id: string, status: string): void {
    // Validate status against allowed values
    const allowedStatuses = ['open', 'in_progress', 'closed'];
    if (!allowedStatuses.includes(status)) {
      console.warn('[DataService] Estado de ticket inválido:', status);
      return;
    }

    let oldStatus = '';
    const tickets = this.getTickets().map(t => {
      if (t.id === id) {
        oldStatus = t.status;
        return { ...t, status };
      }
      return t;
    });
    this.setStore(STORE_KEYS.TICKETS, tickets);
    this.addAuditLog('Estado', 'Tickets', `Se cambió el estado del ticket`, [{ field: 'Estado', old: this.translateStatus(oldStatus), new: this.translateStatus(status) }]);
  }

  addTicketNote(id: string, note: string): void {
    const sanitizedNote = this.security.sanitizeString(note, 500);
    const tickets = this.getTickets().map(t => {
      if (t.id === id) {
        return { ...t, notes: [...(t.notes || []), { text: sanitizedNote, date: new Date().toISOString() }] };
      }
      return t;
    });
    this.setStore(STORE_KEYS.TICKETS, tickets);
    this.addAuditLog('Comentario', 'Tickets', `Se agregó un comentario a un ticket`);
  }

  // --- BACKUPS ---
  getFullBackup(): any {
    return {
      machines: this.getMachines(),
      locations: this.getLocations(),
      cuts: this.getCuts(),
      tickets: this.getTickets(),
      audit: this.getAuditLogs(),
      user: this.getStore(STORE_KEYS.USER),
      _meta: {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        app: 'PinballNG'
      }
    };
  }

  restoreData(moduleName: string, dataArray: any[]): boolean {
    const keys: Record<string, string> = {
      'machines': STORE_KEYS.MACHINES,
      'locations': STORE_KEYS.LOCATIONS,
      'cuts': STORE_KEYS.CUTS,
      'tickets': STORE_KEYS.TICKETS,
      'audit': STORE_KEYS.AUDIT,
      'user': STORE_KEYS.USER
    };
    const key = keys[moduleName];
    if (key && Array.isArray(dataArray)) {
      this.setStore(key, dataArray);
      return true;
    }
    return false;
  }

  /**
   * Merges audit logs from a backup with existing ones.
   * Existing logs are preserved; backup logs are appended only if not already present.
   */
  mergeAuditLogs(backupAuditLogs: any[]): void {
    const existingLogs = this.getAuditLogs();
    const existingIds = new Set(existingLogs.map(l => l.id));

    const newLogs = backupAuditLogs.filter(l => !existingIds.has(l.id));
    if (newLogs.length > 0) {
      const merged = [...existingLogs, ...newLogs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.setStore(STORE_KEYS.AUDIT, merged);
    }
  }
}

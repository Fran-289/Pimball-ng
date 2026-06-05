import { Injectable } from '@angular/core';

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

  constructor() {
    this.initStore();
  }

  private getStore(key: string): any[] {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private setStore(key: string, data: any[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
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
      action,
      module,
      details,
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
    this.setStore(STORE_KEYS.USER, [profile]);
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
    machines.push({ ...machine, id: id, createdAt: new Date().toISOString() });
    this.setStore(STORE_KEYS.MACHINES, machines);
    this.addAuditLog('Crear', 'Máquinas', `Se registró la máquina ${id} - ${machine.name}`);
  }

  updateMachine(id: string, updates: any): void {
    let changes: any[] = [];
    const machines = this.getMachines().map(m => {
      if (m.id === id) {
        if (m.name !== updates.name) changes.push({ field: 'Nombre', old: m.name, new: updates.name });
        if (m.status !== updates.status) changes.push({ field: 'Estado', old: this.translateStatus(m.status), new: this.translateStatus(updates.status) });
        if (m.locationId !== updates.locationId) changes.push({ field: 'Ubicación', old: m.locationId, new: updates.locationId });
        if (m.estimatedCost !== updates.estimatedCost) changes.push({ field: 'Costo', old: m.estimatedCost || 0, new: updates.estimatedCost || 0 });
        return { ...m, ...updates };
      }
      return m;
    });
    this.setStore(STORE_KEYS.MACHINES, machines);
    this.addAuditLog('Editar', 'Máquinas', `Se editó la máquina ${id}`, changes.length > 0 ? changes : undefined);
  }

  deleteMachine(id: string): void {
    const machines = this.getMachines().filter(m => m.id !== id);
    this.setStore(STORE_KEYS.MACHINES, machines);
    this.addAuditLog('Eliminar', 'Máquinas', `Se eliminó la máquina ${id}`);
  }

  // --- LOCATIONS ---
  getLocations(): any[] {
    return this.getStore(STORE_KEYS.LOCATIONS);
  }

  addLocation(name: string): string {
    const locations = this.getLocations();
    const id = 'loc_' + Math.random().toString(36).substr(2, 9);
    locations.push({ id, name });
    this.setStore(STORE_KEYS.LOCATIONS, locations);
    this.addAuditLog('Crear', 'Ubicaciones', `Se registró la ubicación ${name}`);
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
    cuts.push({ ...cut, id: this.generateId(), displayId: displayId, date: cut.date || new Date().toISOString() });
    this.setStore(STORE_KEYS.CUTS, cuts);
    this.addAuditLog('Crear', 'Cortes', `Se generó el corte ${displayId} por ${cut.grossIncome}`);
  }

  updateCut(id: string, updates: any, editReason?: string): void {
    let changes: any[] = [];
    const cuts = this.getCuts().map(c => {
      if (c.id === id) {
        let history = c.editHistory || [];
        if (editReason) {
          history.push({
            date: new Date().toISOString(),
            reason: editReason,
            previousGross: c.grossIncome,
            previousNet: c.netIncome
          });
          
          if (c.grossIncome !== updates.grossIncome) {
            changes.push({ field: 'Subtotal', old: c.grossIncome, new: updates.grossIncome });
          }
          if (c.expenses !== updates.expenses) {
            changes.push({ field: 'Gastos', old: c.expenses || 0, new: updates.expenses || 0 });
          }
          if (c.ownerPercentage !== updates.ownerPercentage) {
            changes.push({ field: '% Ganancia', old: c.ownerPercentage, new: updates.ownerPercentage });
          }
        }
        return { ...c, ...updates, editHistory: history };
      }
      return c;
    });
    this.setStore(STORE_KEYS.CUTS, cuts);
    this.addAuditLog('Editar', 'Cortes', `Se editó el corte. Razón: ${editReason || 'Ajuste interno'}`, changes.length > 0 ? changes : undefined);
  }

  deleteCut(id: string): void {
    const cuts = this.getCuts().filter(c => c.id !== id);
    this.setStore(STORE_KEYS.CUTS, cuts);
    this.addAuditLog('Eliminar', 'Cortes', `Se eliminó un corte del historial`);
  }

  deleteLocation(id: string): void {
    const locations = this.getLocations().filter(l => l.id !== id);
    this.setStore(STORE_KEYS.LOCATIONS, locations);
    this.addAuditLog('Eliminar', 'Ubicaciones', `Se eliminó una ubicación`);
  }

  // --- TICKETS ---
  getTickets(): any[] {
    return this.getStore(STORE_KEYS.TICKETS);
  }

  addTicket(ticket: any): void {
    const tickets = this.getTickets();
    const id = this.generateId();
    tickets.push({ ...ticket, id: id, status: 'open', createdAt: new Date().toISOString(), notes: [] });
    this.setStore(STORE_KEYS.TICKETS, tickets);
    this.addAuditLog('Crear', 'Tickets', `Se abrió el ticket de reparación para la máquina ${ticket.machineId}`);
  }

  updateTicketStatus(id: string, status: string): void {
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
    const tickets = this.getTickets().map(t => {
      if (t.id === id) {
        return { ...t, notes: [...(t.notes || []), { text: note, date: new Date().toISOString() }] };
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
      tickets: this.getTickets()
    };
  }

  restoreData(moduleName: string, dataArray: any[]): boolean {
    const keys: Record<string, string> = {
      'machines': STORE_KEYS.MACHINES,
      'locations': STORE_KEYS.LOCATIONS,
      'cuts': STORE_KEYS.CUTS,
      'tickets': STORE_KEYS.TICKETS
    };
    const key = keys[moduleName];
    if (key && Array.isArray(dataArray)) {
      this.setStore(key, dataArray);
      return true;
    }
    return false;
  }
}

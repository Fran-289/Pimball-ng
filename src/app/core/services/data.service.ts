import { Injectable } from '@angular/core';

const STORE_KEYS = {
  MACHINES: 'pm_machines',
  LOCATIONS: 'pm_locations',
  CUTS: 'pm_cuts',
  TICKETS: 'pm_tickets',
  USER: 'pm_user'
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
      nextNum = Math.max(...nums) + 1;
    }
    const id = 'M-' + String(nextNum).padStart(2, '0');
    machines.push({ ...machine, id: id, createdAt: new Date().toISOString() });
    this.setStore(STORE_KEYS.MACHINES, machines);
  }

  updateMachine(id: string, updates: any): void {
    const machines = this.getMachines().map(m => m.id === id ? { ...m, ...updates } : m);
    this.setStore(STORE_KEYS.MACHINES, machines);
  }

  deleteMachine(id: string): void {
    const machines = this.getMachines().filter(m => m.id !== id);
    this.setStore(STORE_KEYS.MACHINES, machines);
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
  }

  // --- TICKETS ---
  getTickets(): any[] {
    return this.getStore(STORE_KEYS.TICKETS);
  }

  addTicket(ticket: any): void {
    const tickets = this.getTickets();
    tickets.push({ ...ticket, id: this.generateId(), status: 'open', createdAt: new Date().toISOString(), notes: [] });
    this.setStore(STORE_KEYS.TICKETS, tickets);
  }

  updateTicketStatus(id: string, status: string): void {
    const tickets = this.getTickets().map(t => t.id === id ? { ...t, status } : t);
    this.setStore(STORE_KEYS.TICKETS, tickets);
  }

  addTicketNote(id: string, note: string): void {
    const tickets = this.getTickets().map(t => {
      if (t.id === id) {
        return { ...t, notes: [...(t.notes || []), { text: note, date: new Date().toISOString() }] };
      }
      return t;
    });
    this.setStore(STORE_KEYS.TICKETS, tickets);
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

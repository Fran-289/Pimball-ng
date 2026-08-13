import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  tickets: any[] = [];
  machines: any[] = [];
  isModalOpen = false;
  isViewModalOpen = false;
  
  formTicket = {
    machineId: '',
    title: '',
    description: '',
    priority: 'media'
  };

  selectedTicket: any = null;
  tempStatus = '';
  newNote = '';

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.tickets = this.dataService.getTickets();
    this.machines = this.dataService.getMachines().sort((a, b) => (a?.id || '').localeCompare(b?.id || ''));
    this.cdr.detectChanges();
  }

  getMachineName(id: string): string {
    const m = this.machines.find(m => m.id === id);
    return m ? `${m.id} - ${m.name}` : 'Desconocida';
  }

  getTicketsByStatus(status: string): any[] {
    return this.tickets.filter(t => t.status === status).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  openModal() {
    this.formTicket = {
      machineId: this.machines.length > 0 ? this.machines[0].id : '',
      title: '',
      description: '',
      priority: 'media'
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveTicket() {
    if (!this.formTicket.machineId || !this.formTicket.title) {
      alert('Debes seleccionar una máquina y agregar un título.');
      return;
    }
    
    this.dataService.addTicket(this.formTicket);
    this.loadData();
    this.closeModal();
  }

  viewTicket(ticket: any) {
    this.selectedTicket = ticket;
    this.tempStatus = ticket.status === 'open' ? 'progress' : ticket.status;
    this.isViewModalOpen = true;
    this.newNote = '';
  }

  saveStatus() {
    if (this.selectedTicket) {
      if (this.selectedTicket.status !== this.tempStatus) {
        this.dataService.updateTicketStatus(this.selectedTicket.id, this.tempStatus);
        this.loadData();
      }
      this.closeViewModal();
    }
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedTicket = null;
  }

  addNote() {
    if (this.newNote.trim() && this.selectedTicket) {
      this.dataService.addTicketNote(this.selectedTicket.id, this.newNote.trim());
      this.loadData();
      this.selectedTicket = this.tickets.find(t => t.id === this.selectedTicket.id);
      this.newNote = '';
    }
  }

  changeStatus(status: string) {
    if (this.selectedTicket) {
      this.dataService.updateTicketStatus(this.selectedTicket.id, status);
      this.loadData();
      this.selectedTicket = this.tickets.find(t => t.id === this.selectedTicket.id);
    }
  }

  capitalizeFirst(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  host: {
    class: 'block w-full h-full'
  }
})
export class Inventory implements OnInit {
  machines: any[] = [];
  locations: any[] = [];
  
  isModalOpen = false;
  isImageViewModalOpen = false;
  editingId: string | null = null;
  selectedImageUrl: string = '';
  
  // Form fields
  formMachine = {
    name: '',
    type: 'Pimball 6',
    locationName: '', // For the input list
    locationId: '',
    status: 'active',
    notes: '',
    photo: '',
    installDate: '',
    estimatedCost: 0
  };

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.machines = this.dataService.getMachines().sort((a, b) => {
      // Ordenar alfanuméricamente asegurando que M-01 va antes que M-02, etc.
      const idA = a?.id || '';
      const idB = b?.id || '';
      return idA.localeCompare(idB);
    });
    this.locations = this.dataService.getLocations();
    this.cdr.detectChanges(); // Force view update to fix navigation rendering issues
  }

  getLocationName(id: string): string {
    const loc = this.locations.find(l => l.id === id);
    return loc ? loc.name : 'Sin asignar';
  }

  openModal(machine?: any) {
    if (machine) {
      this.editingId = machine.id;
      this.formMachine = { 
        ...machine, 
        locationName: this.getLocationName(machine.locationId),
        installDate: machine.installDate || '',
        estimatedCost: machine.estimatedCost || 0
      };
    } else {
      this.editingId = null;
      this.formMachine = { 
        name: '', 
        type: 'Pimball 6', 
        locationName: '', 
        locationId: '', 
        status: 'active', 
        notes: '', 
        photo: '',
        installDate: '',
        estimatedCost: 0
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveMachine() {
    if (!this.formMachine.name.trim() || !this.formMachine.locationName.trim()) {
      alert('Por favor, completa el nombre y la ubicación de la máquina.');
      return;
    }

    // Handle dynamic location creation or selection
    const locName = this.formMachine.locationName.trim();
    let loc = this.locations.find(l => l.name.toLowerCase() === locName.toLowerCase());
    if (loc) {
      this.formMachine.locationId = loc.id;
    } else {
      // Create new location
      this.formMachine.locationId = this.dataService.addLocation(locName);
    }

    if (this.editingId) {
      this.dataService.updateMachine(this.editingId, this.formMachine);
    } else {
      this.dataService.addMachine(this.formMachine);
    }
    
    this.loadData();
    this.closeModal();
  }

  deleteMachine(id: string) {
    const machine = this.machines.find(m => m.id === id);
    if (machine && machine.status !== 'inactive') {
      // Regla de negocio: No se puede eliminar si no está inactiva.
      // Se pide explícitamente no mostrar notificación para que no cualquiera sepa el truco.
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta máquina? Esto no se puede deshacer.')) {
      const reason = prompt('Razón de la eliminación:');
      if (reason !== null) {
        this.dataService.deleteMachine(id, reason || 'No especificada');
        this.loadData();
      }
    }
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            this.formMachine.photo = canvas.toDataURL('image/jpeg', 0.7);
          } else {
            this.formMachine.photo = e.target.result;
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  viewImage(photoUrl: string) {
    if (photoUrl) {
      this.selectedImageUrl = photoUrl;
      this.isImageViewModalOpen = true;
    }
  }

  closeImageView() {
    this.isImageViewModalOpen = false;
    this.selectedImageUrl = '';
  }

  capitalizeFirst(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  isModalOpen = false;
  userProfile: any = {};
  editProfile: any = {};

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.userProfile = this.dataService.getUserProfile();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  openProfileModal() {
    this.editProfile = { ...this.userProfile };
    this.isModalOpen = true;
  }

  closeProfileModal() {
    this.isModalOpen = false;
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editProfile.photo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    this.userProfile = { ...this.editProfile };
    this.dataService.saveUserProfile(this.userProfile);
    this.isModalOpen = false;
  }
}

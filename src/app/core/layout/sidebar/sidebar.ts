import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() isCollapsed = false;
  @Input() isOpenMobile = false;
  @Output() linkClicked = new EventEmitter<void>();

  showCreditsModal = false;

  onLinkClick() {
    this.linkClicked.emit();
  }

  openCredits() {
    this.showCreditsModal = true;
  }

  closeCredits() {
    this.showCreditsModal = false;
  }
}

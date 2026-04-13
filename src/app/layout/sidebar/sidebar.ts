import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'dashboard',         route: '/dashboard' },
    { label: 'Training Plans', icon: 'event_note',        route: '/training-plans' },
    { label: 'Formations',     icon: 'local_library',     route: '/formations' },
    { label: 'Sessions',       icon: 'groups',            route: '/sessions' },
    { label: 'Instructors',    icon: 'record_voice_over', route: '/instructors' },
    { label: 'Reporting',      icon: 'analytics',         route: '/reporting' },
  ];

  bottomItems: NavItem[] = [
    { label: 'Settings', icon: 'settings', route: '/settings' },
    { label: 'Support',  icon: 'help',     route: '/support' },
  ];
}

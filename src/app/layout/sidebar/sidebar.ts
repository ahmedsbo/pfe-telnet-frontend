import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from '../../services/auth';
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
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Formations', icon: 'school', route: '/formations' },
    { label: 'Sessions', icon: 'groups', route: '/sessions' },
    { label: 'Training Plans', icon: 'event_note', route: '/training-plans' },
    { label: 'Demandes', icon: 'assignment', route: '/demandes' },
    { label: 'Organismes', icon: 'corporate_fare', route: '/organismes' },
    { label: 'Évaluations', icon: 'grading', route: '/evaluations' },
  ];

  constructor(private auth: Auth, private router: Router) { }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

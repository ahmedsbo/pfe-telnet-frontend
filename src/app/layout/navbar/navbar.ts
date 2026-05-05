import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {

  user = {
    name: 'Utilisateur Connecté',
    role: 'Employé',
    initials: 'UC'
  };

  constructor(private router: Router, private authService: Auth) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      let nom = currentUser.nom || currentUser.user?.nom || currentUser.lastName || '';
      let prenom = currentUser.prenom || currentUser.user?.prenom || currentUser.firstName || '';
      let role = currentUser.role || currentUser.user?.role || (currentUser.roles && currentUser.roles[0]) || '';

      // If missing nom/prenom, try to use username or email
      if (!nom && !prenom) {
        prenom = currentUser.username || currentUser.email || '';
      }

      // If still missing, try to parse the JWT
      if (!nom && !prenom && (currentUser.token || currentUser.accessToken)) {
        try {
          const token = currentUser.token || currentUser.accessToken;
          const payload = JSON.parse(atob(token.split('.')[1]));
          prenom = payload.prenom || payload.firstName || payload.sub || payload.username || 'Utilisateur';
          nom = payload.nom || payload.lastName || '';
          role = role || payload.role || (payload.roles && payload.roles[0]) || '';
        } catch (e) {}
      }
      
      const fullName = (prenom + ' ' + nom).trim();
      
      if (fullName) {
        this.user.name = fullName;
        this.user.initials = (prenom.charAt(0) + (nom ? nom.charAt(0) : '')).toUpperCase() || 'U';
      }
      
      if (role) {
        // clean up role name if it's like ROLE_ADMIN
        this.user.role = role.replace('ROLE_', '');
      }
    }
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }
}

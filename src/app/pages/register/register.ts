import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

 nom: string = '';
 prenom: string = '';
 email: string = '';
 password: string = '';
 confirmPassword: string = '';
 matricule: string = '';
 role: string = '';
  error: string = '';
  success: string = '';
  isLoading: boolean = false;

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  handleRegister() {
    this.error = '';
    this.success = '';

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.isLoading = true;
    this.auth.register(
      this.nom,
      this.prenom,
      this.email,
      this.password,
      this.matricule,
      this.role).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.success = 'Compte créé avec succès ! Redirection...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Inscription non réussie.';
      }
    });
  }
}

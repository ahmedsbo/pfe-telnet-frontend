import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';
  error: string = '';
  isLoading: boolean = false;  // ← virgule ; remplacée par :

  constructor(
    private auth: Auth,      // ← private obligatoire
    private router: Router   // ← private obligatoire
  ) {}

  handleLogin() {
    this.error = '';
    this.isLoading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (response: any) => {   // ← type any ajouté
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {       // ← type any ajouté
        this.isLoading = false;
        this.error = 'Identifiants invalides';

      }
    });
  }
}

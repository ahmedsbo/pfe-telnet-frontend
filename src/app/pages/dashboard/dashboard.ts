import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  currentUser: any = null;

  stats = [
    { label: 'Formations actives', value: '0', icon: '📚' },
    { label: 'Employés formés', value: '0', icon: '👥' },
    { label: 'En cours', value: '0', icon: '🔄' },
    { label: 'Terminées', value: '0', icon: '✅' },
  ];

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
  }
}

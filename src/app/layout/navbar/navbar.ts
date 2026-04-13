import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  searchQuery = '';

  user = {
    name: 'Admin Telnet',
    role: 'Administrator',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfQ9_BZvqkQjipozI05WtofyYpNE9yb4WPjLenZnY50OT0DsxRZ_YscRVMLMNry9bGMHqLQ3KTEfq0qJdtxXSLYuuFXGZYFP5xjzpJeNtXC1LLr9ZogdVWDToQ50bpGWD4SaASUb1bLBoeaemzxI8guyE2JHHst9bxJWOx8r4hbzOg2ZGtMUC_lKFkoMCjCodrKaLu8XbV1-ism8n2sZYqVXREYteo67TALOiObP0CgroWgAmszRwbeSi74Nb6IzIQZkAtejfPWrF8'
  };

  constructor(private router: Router) {}

  goToSettings() {
    this.router.navigate(['/settings']);
  }
}

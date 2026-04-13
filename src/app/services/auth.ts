import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private API_URL = 'http://localhost:8080/api/auth/';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.API_URL + 'login', { email, password }).pipe(
      tap((response: any) => {
        localStorage.setItem('user', JSON.stringify(response));
      })
    );
  }

  register(nom: string, prenom: string, email: string,
           password: string, matricule: string, role: string): Observable<any> {
    return this.http.post(this.API_URL + 'signup', {
      nom, prenom, email, password, matricule, role
    });
  }

  logout(): void {
    localStorage.removeItem('user');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormateurExterne } from '../models/formateur-externe';

@Injectable({
  providedIn: 'root'
})
export class FormateurExterneService {
  private apiUrl = 'http://localhost:8080/api/formateurs-externes';

  constructor(private http: HttpClient) { }

  getAll(): Observable<FormateurExterne[]> {
    return this.http.get<FormateurExterne[]>(this.apiUrl);
  }

  getById(id: string): Observable<FormateurExterne> {
    return this.http.get<FormateurExterne>(`${this.apiUrl}/${id}`);
  }

  create(formateur: FormateurExterne): Observable<FormateurExterne> {
    return this.http.post<FormateurExterne>(this.apiUrl, formateur);
  }

  update(id: string, formateur: FormateurExterne): Observable<FormateurExterne> {
    return this.http.put<FormateurExterne>(`${this.apiUrl}/${id}`, formateur);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

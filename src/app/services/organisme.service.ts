import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organisme } from '../models/organisme';

@Injectable({
  providedIn: 'root'
})
export class OrganismeService {
  private apiUrl = '/api/organismes';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Organisme[]> {
    return this.http.get<Organisme[]>(this.apiUrl);
  }

  getById(id: string): Observable<Organisme> {
    return this.http.get<Organisme>(`${this.apiUrl}/${id}`);
  }

  create(organisme: Organisme): Observable<Organisme> {
    return this.http.post<Organisme>(this.apiUrl, organisme);
  }

  update(id: string, organisme: Organisme): Observable<Organisme> {
    return this.http.put<Organisme>(`${this.apiUrl}/${id}`, organisme);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

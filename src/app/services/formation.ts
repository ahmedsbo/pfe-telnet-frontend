import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Formation } from '../models/formation';

@Injectable({
  providedIn: 'root'
})
export class FormationService {

  private API_URL = '/api/formations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Formation[]> {
    return this.http.get<Formation[]>(this.API_URL);
  }

  getById(id: string): Observable<Formation> {
    return this.http.get<Formation>(`${this.API_URL}/${id}`);
  }

  create(formation: Formation): Observable<Formation> {
    return this.http.post<Formation>(this.API_URL, formation);
  }

  update(id: string, formation: Formation): Observable<Formation> {
    return this.http.put<Formation>(`${this.API_URL}/${id}`, formation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

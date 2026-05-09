import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demande } from '../models/demande';

@Injectable({
  providedIn: 'root',
})
export class DemandeService {
   private API_URL = '/api/demandes';

   constructor(private http: HttpClient) {}

   getAll(): Observable<Demande[]> {
    return this.http.get<Demande[]>(this.API_URL);
   }

   getById(id: string): Observable<Demande> {
    return this.http.get<Demande>(`${this.API_URL}/${id}`);
   }

   create(demande: Demande): Observable<Demande> {
    return this.http.post<Demande>(this.API_URL, demande);
   }

   update(id: string, demande: Demande): Observable<Demande> {
    return this.http.put<Demande>(`${this.API_URL}/${id}`, demande);
   }

   delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
   }
}

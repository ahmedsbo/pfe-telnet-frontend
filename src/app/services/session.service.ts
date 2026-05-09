import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Session } from '../models/session';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private API_URL = '/api/sessions';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Session[]> {
    return this.http.get<Session[]>(this.API_URL);
  }

  getByFormationId(formationId: string): Observable<Session[]> {
    return this.http.get<Session[]>(this.API_URL).pipe(
      map(sessions => sessions.filter(s => s.formationId === formationId))
    );
  }

  getById(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.API_URL}/${id}`);
  }

  create(session: Session): Observable<Session> {
    return this.http.post<Session>(this.API_URL, session);
  }

  update(id: string, session: Session): Observable<Session> {
    return this.http.put<Session>(`${this.API_URL}/${id}`, session);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

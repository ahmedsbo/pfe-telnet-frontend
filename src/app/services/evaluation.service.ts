import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation, EvaluationAChaud, EvaluationAFroid } from '../models/evaluation';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {

  private API_URL = '/api/evaluations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(this.API_URL);
  }

  getById(id: string): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.API_URL}/${id}`);
  }

  create(evaluation: Evaluation): Observable<Evaluation> {
    return this.http.post<Evaluation>(this.API_URL, evaluation);
  }

  update(id: string, evaluation: Evaluation): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.API_URL}/${id}`, evaluation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

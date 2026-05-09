import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainingPlan } from '../models/training-plan';

@Injectable({ providedIn: 'root' })
export class TrainingPlanService {

  private API_URL = '/api/plans-formation';

  constructor(private http: HttpClient) {}

  getAll(): Observable<TrainingPlan[]> {
    return this.http.get<TrainingPlan[]>(this.API_URL);
  }

  getById(id: string): Observable<TrainingPlan> {
    return this.http.get<TrainingPlan>(`${this.API_URL}/${id}`);
  }

  create(plan: Partial<TrainingPlan>): Observable<TrainingPlan> {
    return this.http.post<TrainingPlan>(this.API_URL, plan);
  }

  update(id: string, plan: Partial<TrainingPlan>): Observable<TrainingPlan> {
    return this.http.put<TrainingPlan>(`${this.API_URL}/${id}`, plan);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

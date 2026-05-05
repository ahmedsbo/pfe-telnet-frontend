import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { ChangeDetectorRef, OnDestroy } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TrainingPlan, EtatPlan } from '../../models/training-plan';
import { TrainingPlanService } from '../../services/training-plan.service';
import { TrainingPlanFormComponent } from '../training-plan-form/training-plan-form';
import { FormationService } from '../../services/formation';
import { Formation } from '../../models/formation';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/session';

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, TrainingPlanFormComponent],
  templateUrl: './training-plan.html',
  styleUrls: ['./training-plan.css']
})
export class TrainingPlanComponent implements OnInit, OnDestroy {

  plans: TrainingPlan[] = [];
  filteredPlans: TrainingPlan[] = [];
  isLoading = true;
  error: string | null = null;
  formationsMap = new Map<string, string>();
  formationsRefMap = new Map<string, string>();
  sessionsMap = new Map<string, string>();

  // Filters
  selectedStatus = '';
  searchQuery = '';

  // Form toggling
  showForm = false;
  editingPlanId: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  private routerSubscription?: Subscription;

  constructor(
    private trainingPlanService: TrainingPlanService,
    private formationService: FormationService,
    private sessionService: SessionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadAllData();
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.error = null;
    
    forkJoin({
      formations: this.formationService.getAll().pipe(catchError(() => of([]))),
      sessions: this.sessionService.getAll().pipe(catchError(() => of([]))),
      plans: this.trainingPlanService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.formationsMap.clear();
        this.formationsRefMap.clear();
        this.sessionsMap.clear();

        result.formations.forEach(f => {
          if (f.formationId) {
            this.formationsMap.set(f.formationId, f.titre);
            this.formationsRefMap.set(f.formationId, f.reference || '-');
          }
        });

        result.sessions.forEach(s => {
          if (s.id) this.sessionsMap.set(s.id, s.reference || '-');
        });

        this.plans = result.plans;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  getFormationName(id?: string): string {
    return id ? (this.formationsMap.get(id) || id) : '-';
  }

  getReferenceFormation(id?: string): string {
    return id ? (this.formationsRefMap.get(id) || id) : '-';
  }

  getReferenceSession(id?: string): string {
    return id ? (this.sessionsMap.get(id) || id) : '-';
  }

  applyFilters(): void {
    let result = [...this.plans];

    // Status filter
    if (this.selectedStatus) {
      result = result.filter(p => p.etatplan === this.selectedStatus);
    }

    // Search query filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.titre && s.titre.toLowerCase().includes(q)) ||
        (s.reference && s.reference.toLowerCase().includes(q)) ||
        (s.etatplan && s.etatplan.toLowerCase().includes(q))
      );
    }

    this.filteredPlans = result;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.searchQuery = '';
    this.applyFilters();
  }


  // ── Pagination ──
  get paginatedPlans(): TrainingPlan[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPlans.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPlans.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  // ── Status helpers ──
  getStatusLabel(status: EtatPlan): string {
    const map: Record<EtatPlan, string> = {
      EN_PREPARATION: 'EN PRÉPARATION',
      EN_VALIDATION: 'EN VALIDATION',
      VALIDE: 'VALIDÉ',
      CLOTURE: 'CLÔTURÉ'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: EtatPlan): string {
    const map: Record<EtatPlan, string> = {
      EN_PREPARATION: 'badge badge--preparation',
      EN_VALIDATION: 'badge badge--validation',
      VALIDE: 'badge badge--valide',
      CLOTURE: 'badge badge--cloture'
    };
    return map[status] ?? 'badge';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  // ── Actions ──
  viewPlan(plan: TrainingPlan): void {
    console.log('View:', plan);
  }

  editPlan(plan: TrainingPlan): void {
    if (plan.planFormationId) {
      this.showForm = true;
      this.editingPlanId = plan.planFormationId;
    }
  }

  deletePlan(plan: TrainingPlan): void {
    if (!confirm(`Supprimer "${plan.titre}" ?`)) return;
    this.trainingPlanService.delete(plan.planFormationId!).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error(err)
    });
  }

  createNewPlan(): void {
    this.showForm = true;
    this.editingPlanId = null;
  }

  onFormClose(saved: boolean): void {
    this.showForm = false;
    this.editingPlanId = null;
    if (saved) {
      this.loadAllData();
    }
  }
}

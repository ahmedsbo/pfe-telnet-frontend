import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainingPlan, EtatPlan } from '../../models/training-plan';
import { TrainingPlanService } from '../../services/training-plan.service';
import { TrainingPlanFormComponent } from '../training-plan-form/training-plan-form';

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, TrainingPlanFormComponent],
  templateUrl: './training-plan.html',
  styleUrls: ['./training-plan.css']
})
export class TrainingPlanComponent implements OnInit {

  plans: TrainingPlan[] = [];
  filteredPlans: TrainingPlan[] = [];
  isLoading = true;
  error: string | null = null;

  // Filters
  selectedStatus = '';

  // Form toggling
  showForm = false;
  editingPlanId: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  constructor(
    private trainingPlanService: TrainingPlanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.error = null;
    this.trainingPlanService.getAll().subscribe({
      next: (data) => {
        this.plans = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger les plans de formation.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    let result = [...this.plans];
    if (this.selectedStatus) {
      result = result.filter(p => p.etatplan === this.selectedStatus);
    }
    this.filteredPlans = result;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.filteredPlans = [...this.plans];
    this.currentPage = 1;
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
      EN_VALIDATION:  'EN VALIDATION',
      VALIDE:         'VALIDÉ',
      CLOTURE:        'CLÔTURÉ'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: EtatPlan): string {
    const map: Record<EtatPlan, string> = {
      EN_PREPARATION: 'badge badge--preparation',
      EN_VALIDATION:  'badge badge--validation',
      VALIDE:         'badge badge--valide',
      CLOTURE:        'badge badge--cloture'
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
      next: () => this.loadPlans(),
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
      this.loadPlans();
    }
  }
}

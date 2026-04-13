import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Session } from '../../models/session';
import { SessionService } from '../../services/session.service';
import { SessionFormComponent } from '../session-form/session-form';
import { FormationService } from '../../services/formation';
import { TrainingPlanService } from '../../services/training-plan.service';
import { Formation } from '../../models/formation';
import { TrainingPlan } from '../../models/training-plan';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, SessionFormComponent],
  templateUrl: './sessions.html',
  styleUrls: ['./sessions.css']
})
export class SessionsComponent implements OnInit {

  sessions: Session[] = [];
  filteredSessions: Session[] = [];
  isLoading = true;
  error: string | null = null;

  // Caching references to replace IDs with Titles in the table
  formationsMap = new Map<string, string>();
  plansMap = new Map<string, string>();

  // Form toggling
  showForm = false;
  editingSessionId: string | null = null;

  // Filters
  searchQuery = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  constructor(
    private sessionService: SessionService,
    private formationService: FormationService,
    private planService: TrainingPlanService
  ) {}

  ngOnInit(): void {
    // Load dictionary of formations/plans to show real names instead of IDs
    this.formationService.getAll().subscribe(formations => {
      formations.forEach(f => {
        if(f.formationId) this.formationsMap.set(f.formationId, f.titre);
      });
      // Then load plans
      this.planService.getAll().subscribe(plans => {
        plans.forEach(p => {
          if(p.planFormationId) this.plansMap.set(p.planFormationId, p.titre);
        });
        // Finally load sessions
        this.loadSessions();
      });
    });
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionService.getAll().subscribe({
      next: (data) => {
        this.sessions = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des sessions.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  getFormationName(id?: string): string {
    return id ? (this.formationsMap.get(id) || id) : 'Non attribuée';
  }

  getPlanName(id?: string): string {
    return id ? (this.plansMap.get(id) || id) : 'Non attribué';
  }

  applyFilters(): void {
    if (!this.searchQuery) {
      this.filteredSessions = [...this.sessions];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredSessions = this.sessions.filter(s => 
        (s.formateur && s.formateur.toLowerCase().includes(q)) ||
        (s.formationId && this.getFormationName(s.formationId).toLowerCase().includes(q))
      );
    }
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  // Pagination getters
  get paginatedSessions(): Session[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSessions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSessions.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    // Handle both LocalDateTime and LocalDate parsing
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  editSession(session: Session): void {
    if (session.id) {
      this.showForm = true;
      this.editingSessionId = session.id;
    }
  }

  deleteSession(session: Session): void {
    if (!confirm(`Supprimer la session animée par "${session.formateur}" ?`)) return;
    this.sessionService.delete(session.id!).subscribe({
      next: () => this.loadSessions(),
      error: (err) => console.error(err)
    });
  }

  createNewSession(): void {
    this.showForm = true;
    this.editingSessionId = null;
  }

  onFormClose(saved: boolean): void {
    this.showForm = false;
    this.editingSessionId = null;
    if (saved) {
      this.loadSessions();
    }
  }
}

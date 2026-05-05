import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Formation } from '../../models/formation';
import { FormationService } from '../../services/formation';
import { FormationFormComponent } from '../formation-form/formation-form';

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, FormsModule, FormationFormComponent, Navbar],
  templateUrl: './formations.html',
  styleUrls: ['./formations.css']
})
export class Formations implements OnInit {

  formations: Formation[] = [];
  filteredFormations: Formation[] = [];
  isLoading = true;
  error: string | null = null;


  // Filters
  selectedStatus = '';
  searchQuery = '';

  // Form toggling
  showForm = false;
  editingFormationId: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  private routerSubscription?: Subscription;

  constructor(
    private formationService: FormationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadFormations();
    });
  }

  ngOnInit() {
    this.loadFormations();
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  loadFormations() {
    this.isLoading = true;
    this.error = null;
    this.formationService.getAll().subscribe({
      next: (data) => {
        this.formations = data.sort((a, b) => 
          a.reference.localeCompare(b.reference, undefined, { numeric: true, sensitivity: 'base' })
        );
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des formations';
        this.isLoading = false;
      }
    });
  }


  applyFilters(): void {
    let result = [...this.formations];
    if (this.selectedStatus) {
      result = result.filter(f => f.etatformation === this.selectedStatus);
    }
    this.filteredFormations = result;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.filteredFormations = [...this.formations];
    this.currentPage = 1;
  }

  applyFiltersSearch(): void {
    if (!this.searchQuery) {
      this.filteredFormations = [...this.formations];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredFormations = this.formations.filter(s =>
        (s.titre && s.titre.toLowerCase().includes(q)) ||
        (s.reference && s.reference.toLowerCase().includes(q)) ||
        (s.typeFormation && s.typeFormation.toLowerCase().includes(q))

      );
    }
    this.currentPage = 1;
  }

  resetFiltersSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  // ── Pagination ──
  get paginatedFormations(): Formation[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredFormations.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredFormations.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PLANIFIEE: 'PLANIFIÉE',
      EN_COURS: 'EN COURS',
      TERMINEE: 'TERMINÉE',
      ANNULEE: 'ANNULÉE'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PLANIFIEE: 'badge badge--planifiee',
      EN_COURS: 'badge badge--encours',
      TERMINEE: 'badge badge--terminee',
      ANNULEE: 'badge badge--annulee'
    };
    return map[status] ?? 'badge';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  viewFormation(formation: Formation): void {
    console.log('View:', formation);
  }

  editFormation(formation: Formation): void {
    if (formation.formationId) {
      this.showForm = true;
      this.editingFormationId = formation.formationId;
    }
  }

  deleteFormation(formation: Formation): void {
    if (!confirm(`Supprimer la formation "${formation.titre}" ?`)) return;
    this.formationService.delete(formation.formationId!).subscribe({
      next: () => this.loadFormations(),
      error: (err) => console.error(err)
    });
  }

  createNewFormation(): void {
    this.showForm = true;
    this.editingFormationId = null;
  }

  onFormClose(saved: boolean): void {
    this.showForm = false;
    this.editingFormationId = null;
    if (saved) {
      this.loadFormations();
    }
  }
}

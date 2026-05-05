import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { ChangeDetectorRef, OnDestroy } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Session } from '../../models/session';
import { SessionService } from '../../services/session.service';
import { SessionFormComponent } from '../session-form/session-form';
import { FormationService } from '../../services/formation';
import { Formation } from '../../models/formation';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, SessionFormComponent],
  templateUrl: './sessions.html',
  styleUrls: ['./sessions.css']
})
export class SessionsComponent implements OnInit, OnDestroy {

  sessions: Session[] = [];
  groupedSessions: { reference: string, sessions: Session[], selectedIndex: number }[] = [];
  filteredGroups: { reference: string, sessions: Session[], selectedIndex: number }[] = [];
  isLoading = true;
  error: string | null = null;

  // Caching references to replace IDs with Titles in the table
  formationsMap = new Map<string, string>();

  // Form toggling
  showForm = false;
  editingSessionId: string | null = null;

  // Filters
  searchQuery = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  private routerSubscription?: Subscription;

  constructor(
    private sessionService: SessionService,
    private formationService: FormationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadSessions();
    });
  }

  ngOnInit(): void {
    this.loadFormations();
    this.loadSessions();
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  loadFormations(): void {
    this.formationService.getAll().subscribe({
      next: (data) => {
        data.forEach(f => {
          if (f.formationId) this.formationsMap.set(f.formationId, f.titre);
        });
      },
      error: (err) => console.error('Erreur chargement dictionnaire formations', err)
    });
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionService.getAll().subscribe({
      next: (data) => {
        this.sessions = data;
        this.groupSessions();
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des sessions.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  private groupSessions(): void {
    const map = new Map<string, Session[]>();
    this.sessions.forEach(s => {
      const ref = s.reference || 'Sans référence';
      if (!map.has(ref)) map.set(ref, []);
      map.get(ref)?.push(s);
    });

    this.groupedSessions = Array.from(map.entries()).map(([ref, sessions]) => ({
      reference: ref,
      sessions: sessions.sort((a, b) => a.titre.localeCompare(b.titre)),
      selectedIndex: 0
    })).sort((a, b) => a.reference.localeCompare(b.reference, undefined, { numeric: true }));
  }

  getFormationName(id?: string): string {
    return id ? (this.formationsMap.get(id) || id) : 'Non attribuée';
  }


  applyFilters(): void {
    if (!this.searchQuery) {
      this.filteredGroups = [...this.groupedSessions];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredGroups = this.groupedSessions.filter(g => 
        g.reference.toLowerCase().includes(q) ||
        g.sessions.some(s => 
          (s.titre && s.titre.toLowerCase().includes(q)) ||
          (s.formateur && s.formateur.toLowerCase().includes(q)) ||
          (s.formationId && this.getFormationName(s.formationId).toLowerCase().includes(q))
        )
      );
    }
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  // Pagination getters
  get paginatedGroups(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredGroups.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredGroups.length / this.itemsPerPage);
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

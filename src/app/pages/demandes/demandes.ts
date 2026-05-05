import { Component, OnInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { DemandeService } from '../../services/demande';
import { Demande } from '../../models/demande';
import { FormationService } from '../../services/formation';
import { Formation } from '../../models/formation';
import { EmployeService } from '../../services/employe.service';
import { Employe } from '../../models/employe';
import { TrainingPlanService } from '../../services/training-plan.service';
import { TrainingPlan } from '../../models/training-plan';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './demandes.html',
  styleUrls: ['./demandes.css']
})
export class Demandes implements OnInit, OnDestroy {
  demandes: Demande[] = [];
  filteredDemandes: Demande[] = [];
  formations: Formation[] = [];
  employes: Employe[] = [];
  plans: TrainingPlan[] = [];

  demandeForm: FormGroup;
  isModalOpen = false;
  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 5;
  isLoading = true;

  get totalPages(): number {
    return Math.ceil(this.filteredDemandes.length / this.itemsPerPage);
  }

  get paginatedDemandes(): Demande[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDemandes.slice(start, start + this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }


  private routerSubscription?: Subscription;
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private demandeService: DemandeService,
    private formationService: FormationService,
    private employeService: EmployeService,
    private trainingPlanService: TrainingPlanService,
    private fb: FormBuilder
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadDemandes();
    });
    this.demandeForm = this.fb.group({
      titre: ['', Validators.required],
      utilisateurId: ['', Validators.required],
      dateDemande: [new Date().toISOString().substring(0, 10), Validators.required],
      formationId: [''],
      planFormationId: [''],
      etatDemande: ['En attente']
    });


    // Auto-select plan when formation is selected
    this.demandeForm.get('formationId')?.valueChanges.subscribe(fId => {
      if (fId) {
        const plan = this.plans.find(p => p.formationId === fId);
        if (plan) {
          this.demandeForm.get('planFormationId')?.setValue(plan.planFormationId);
        }
      }
    });
  }


  ngOnInit(): void {
    this.loadDemandes();
    this.loadFormations();
    this.loadEmployes();
    this.loadPlans();
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }
  applyFilters(): void {
    if (!this.searchQuery) {
      this.filteredDemandes = [...this.demandes];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredDemandes = this.demandes.filter(s =>
        (s.titre && s.titre.toLowerCase().includes(q)) ||
        (s.demandeur && s.demandeur.toLowerCase().includes(q)) ||
        (s.etatDemande && s.etatDemande.toLowerCase().includes(q))

      );
    }
    this.currentPage = 1;
  }
  resetFilters(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  loadDemandes(): void {
    this.isLoading = true;
    this.demandeService.getAll().subscribe({
      next: (data: Demande[]) => {
        this.demandes = data;
        this.filteredDemandes = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('erreur reseau', err);
        this.isLoading = false;
      }
    });
  }

  loadFormations(): void {
    this.formationService.getAll().subscribe({
      next: (data: Formation[]) => this.formations = data,
      error: (err: any) => console.error('Erreur chargement formations', err)
    });
  }

  loadEmployes(): void {
    this.employeService.getAll().subscribe({
      next: (data: Employe[]) => this.employes = data,
      error: (err: any) => console.error('Erreur chargement employés', err)
    });
  }

  loadPlans(): void {
    this.trainingPlanService.getAll().subscribe({
      next: (data: TrainingPlan[]) => this.plans = data,
      error: (err: any) => console.error('Erreur chargement plans', err)
    });
  }

  getBadgeClass(etat: string | undefined): string {
    if (!etat) return 'badge--warning';
    switch (etat.toLowerCase()) {
      case 'approuvée':
      case 'approuvé':
      case 'approuve':
        return 'badge--success';
      case 'rejetée':
      case 'rejete':
        return 'badge--danger';
      case 'en attente':
        return 'badge--warning';
      default:
        return 'badge--grey';
    }
  }

  getFormationTitle(id?: string): string {
    if (!id) return '-';
    const formation = this.formations.find(f => f.formationId === id);
    return formation ? formation.titre : '-';
  }

  getPlanTitle(id?: string): string {
    if (!id) return '-';
    const plan = this.plans.find(p => p.planFormationId === id);
    return plan ? plan.titre : '-';
  }

  createNewDemande(): void {
    this.demandeForm.reset({
      dateDemande: new Date().toISOString().substring(0, 10),
      etatDemande: 'En attente'
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  submitDemande(): void {
    if (this.demandeForm.invalid) return;

    const newDemande: Demande = this.demandeForm.value;

    const employeSelected = this.employes.find(e => e.utilisateurId === newDemande.utilisateurId);
    if (employeSelected) {
      newDemande.demandeur = `${employeSelected.nom} ${employeSelected.prenom}`;
    }

    this.demandeService.create(newDemande).subscribe({
      next: (created: Demande) => {
        this.demandes.push(created);
        this.applyFilters();
        this.closeModal();
      },
      error: (err: any) => console.error('Erreur de création', err)
    });
  }

  updateStatus(demande: Demande, nouvelEtat: string): void {
    if (!demande.demandeId) return;

    const ancienEtat = demande.etatDemande;
    demande.etatDemande = nouvelEtat;

    this.demandeService.update(demande.demandeId, demande).subscribe({
      next: () => console.log('Statut mis à jour avec succès'),
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour', err);
        demande.etatDemande = ancienEtat; // Restauration en cas d'erreur
      }
    });
  }

  deleteDemande(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      this.demandeService.delete(id).subscribe({
        next: () => {
          this.demandes = this.demandes.filter(d => d.demandeId !== id);
          this.applyFilters();
        },
        error: (err: any) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }
}

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
      reference: [{ value: '', disabled: true }],
      etatDemande: ['EN_ATTENTE']
    });

    // Auto-generation logic
    this.demandeForm.get('formationId')?.valueChanges.subscribe(fId => {
      if (fId) {
        const plan = this.plans.find(p => p.formationId === fId);
        if (plan) {
          this.demandeForm.get('planFormationId')?.setValue(plan.planFormationId, { emitEvent: false });
        }
        this.autoGenerateReference();
      }
    });

    this.demandeForm.get('planFormationId')?.valueChanges.subscribe(() => {
      this.autoGenerateReference();
    });
  }

  private autoGenerateReference(): void {
    const fId = this.demandeForm.get('formationId')?.value;
    const pId = this.demandeForm.get('planFormationId')?.value;

    if (fId) {
      const formation = this.formations.find(f => f.formationId === fId);
      if (formation && formation.reference) {
        const parts = formation.reference.split('-');
        const suffix = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        // Extract numeric part if suffix is like "S001" or just "001"
        const numericMatch = suffix.match(/\d+/);
        const numericSuffix = numericMatch ? numericMatch[0] : suffix;
        this.demandeForm.get('reference')?.setValue(`REF-D${numericSuffix}`);
        return;
      }
    }

    if (pId) {
      const plan = this.plans.find(p => p.planFormationId === pId);
      if (plan && plan.reference) {
        const parts = plan.reference.split('-');
        const suffix = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        const numericMatch = suffix.match(/\d+/);
        const numericSuffix = numericMatch ? numericMatch[0] : suffix;
        this.demandeForm.get('reference')?.setValue(`REF-D${numericSuffix}`);
        return;
      }
    }
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
        (s.reference && s.reference.toLowerCase().includes(q)) ||
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
    switch (etat.toUpperCase()) {
      case 'ACCEPTEE':
      case 'APPROUVEE':
      case 'APPROUVE':
        return 'badge--success';
      case 'REFUSEE':
      case 'REJETEE':
      case 'REJETE':
        return 'badge--danger';
      case 'EN_ATTENTE':
        return 'badge--warning';
      case 'ANNULEE':
        return 'badge--grey';
      default:
        return 'badge--grey';
    }
  }

  getFormationReference(id?: string): string {
    if (!id) return '-';
    const formation = this.formations.find(f => f.formationId === id || (f as any).id === id || (f as any)._id === id);
    return formation ? formation.reference : '-';
  }

  getPlanReference(id?: string): string {
    if (!id) return '-';
    const plan = this.plans.find(p => p.planFormationId === id || (p as any).id === id || (p as any)._id === id);
    return plan ? plan.reference : '-';
  }

  createNewDemande(): void {
    this.demandeForm.reset({
      dateDemande: new Date().toISOString().substring(0, 10),
      etatDemande: 'EN_ATTENTE'
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  submitDemande(): void {
    if (this.demandeForm.invalid) return;

    const newDemande: Demande = this.demandeForm.getRawValue();

    const alreadyExists = this.demandes.find(d => 
      d.utilisateurId === newDemande.utilisateurId && 
      d.formationId === newDemande.formationId &&
      newDemande.formationId 
    );

    if (alreadyExists) {
      alert('Cet employé a déjà soumis une demande pour cette formation.');
      return;
    }

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

    // On demande confirmation avant d'envoyer le mail d'affectation
    if (nouvelEtat === 'ACCEPTEE') {
      const confirmMail = confirm("Voulez-vous envoyer un mail d'affectation aux demandeurs ?");
      if (!confirmMail) return; // On annule si l'utilisateur clique sur "Annuler"
    }

    const ancienEtat = demande.etatDemande;
    demande.etatDemande = nouvelEtat;

    this.demandeService.update(demande.demandeId, demande).subscribe({
      next: () => {
        console.log('Statut mis à jour avec succès et mail envoyé (si accepté)');
      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour', err);
        demande.etatDemande = ancienEtat; // Restauration en cas d'erreur
        alert("Une erreur est survenue lors de la mise à jour.");
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

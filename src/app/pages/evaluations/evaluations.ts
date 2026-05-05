import { Component, OnInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { EvaluationService } from '../../services/evaluation.service';
import { FormationService } from '../../services/formation';
import { Evaluation, EvaluationAChaud, EvaluationAFroid } from '../../models/evaluation';
import { Formation } from '../../models/formation';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './evaluations.html',
  styleUrl: './evaluations.css'
})
export class EvaluationsComponent implements OnInit, OnDestroy {
  evaluationsChaud: EvaluationAChaud[] = [];
  evaluationsFroid: EvaluationAFroid[] = [];
  formations: Formation[] = [];

  showChaudForm = false;
  showFroidForm = false;
  
  chaudForm: FormGroup;
  froidForm: FormGroup;

  private routerSubscription?: Subscription;
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private evaluationService: EvaluationService,
    private formationService: FormationService,
    private fb: FormBuilder
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadEvaluations();
      this.loadFormations();
    });
    this.chaudForm = this.fb.group({
      titre: ['', Validators.required],
      formateur: ['', Validators.required],
      dateEvaluation: [new Date().toISOString().split('T')[0], Validators.required],
      formationId: ['', Validators.required],
      ameliorationExterne: ['']
    });

    this.froidForm = this.fb.group({
      titre: ['', Validators.required],
      formateur: ['', Validators.required],
      dateEvaluation: [new Date().toISOString().split('T')[0], Validators.required],
      formationId: ['', Validators.required],
      ameliorationInterne: ['']
    });
  }

  ngOnInit(): void {
    this.loadEvaluations();
    this.loadFormations();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadEvaluations(): void {
    this.evaluationService.getAll().subscribe((data: Evaluation[]) => {
      // Filtrage robuste : utilise le champ 'type' s'il existe, sinon vérifie les propriétés spécifiques
      this.evaluationsChaud = data.filter(e => 
        e.type === 'CHAUD' || ('ameliorationExterne' in e)
      ) as EvaluationAChaud[];

      this.evaluationsFroid = data.filter(e => 
        e.type === 'FROID' || ('ameliorationInterne' in e)
      ) as EvaluationAFroid[];
      
      this.cdr.detectChanges();
    });
  }

  loadFormations(): void {
    this.formationService.getAll().subscribe((data: Formation[]) => {
      this.formations = data;
      this.cdr.detectChanges();
    });
  }

  getFormationTitre(id: string): string {
    const formation = this.formations.find(f => f.formationId === id);
    return formation ? formation.titre : 'Inconnue';
  }

  openChaudForm(): void {
    this.showChaudForm = true;
    this.chaudForm.reset({
      dateEvaluation: new Date().toISOString().split('T')[0]
    });
  }

  openFroidForm(): void {
    this.showFroidForm = true;
    this.froidForm.reset({
      dateEvaluation: new Date().toISOString().split('T')[0]
    });
  }

  saveChaud(): void {
    if (this.chaudForm.valid) {
      const evalData: EvaluationAChaud = {
        ...this.chaudForm.value,
        type: 'CHAUD'
      };
      this.evaluationService.create(evalData).subscribe(() => {
        this.loadEvaluations();
        this.showChaudForm = false;
      });
    }
  }

  saveFroid(): void {
    if (this.froidForm.valid) {
      const evalData: EvaluationAFroid = {
        ...this.froidForm.value,
        type: 'FROID'
      };
      this.evaluationService.create(evalData).subscribe(() => {
        this.loadEvaluations();
        this.showFroidForm = false;
      });
    }
  }

  deleteEvaluation(id?: string): void {
    if (id && confirm('Supprimer cette évaluation ?')) {
      this.evaluationService.delete(id).subscribe(() => this.loadEvaluations());
    }
  }
}

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TrainingPlanService } from '../../services/training-plan.service';
import { EtatPlan, TrainingPlan, ModeSeance } from '../../models/training-plan';
import { FormationService } from '../../services/formation';
import { SessionService } from '../../services/session.service';
import { Formation } from '../../models/formation';
import { Session } from '../../models/session';

@Component({
  selector: 'app-training-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './training-plan-form.html',
  styleUrls: ['./training-plan-form.css']
})
export class TrainingPlanFormComponent implements OnInit {
  @Input() planId: string | null = null;
  @Input() allPlans: TrainingPlan[] = []; // Added to access all plans for global validation
  @Output() closeForm = new EventEmitter<boolean>();

  planForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  etatsPlan: EtatPlan[] = ['EN_PREPARATION', 'EN_VALIDATION', 'VALIDE', 'CLOTURE'];
  modesSeance: ModeSeance[] = ['PRESENTIEL', 'EN_LIGNE', 'HYBRIDE'];
  formations: Formation[] = [];
  sessions: Session[] = [];

  constructor(
    private fb: FormBuilder,
    private trainingPlanService: TrainingPlanService,
    private formationService: FormationService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadResources();

    if (this.planId) {
      this.isEditMode = true;
      this.loadPlanData(this.planId);
    }

    // Auto-update dates and filter sessions when formation is selected
    this.planForm.get('formationId')?.valueChanges.subscribe(fId => {
      this.autoGenerateReference();
      
      // Clear selected session if it doesn't belong to the new formation
      const currentSessionId = this.planForm.get('sessionId')?.value;
      if (currentSessionId) {
        const session = this.sessions.find(s => s.id === currentSessionId);
        if (session && session.formationId !== fId) {
          this.planForm.patchValue({ sessionId: '' }, { emitEvent: false });
        }
      }
    });

    this.planForm.get('sessionId')?.valueChanges.subscribe(sId => {
      this.autoGenerateReference();
      const session = this.sessions.find(s => s.id === sId);
      if (session) {
        // Sync plan dates with session dates
        this.planForm.patchValue({
          dateDebut: session.dateDebut ? session.dateDebut.substring(0, 10) : '',
          dateFin: session.dateFin ? session.dateFin.substring(0, 10) : ''
        });
      }
    });
  }

  private autoGenerateReference(): void {
    if (this.isEditMode) return;

    const fId = this.planForm.get('formationId')?.value;
    const sId = this.planForm.get('sessionId')?.value;

    if (fId && sId) {
      const session = this.sessions.find(s => s.id === sId);
      if (session && session.reference) {
        // If session ref is REF-S001, we want REF-P001
        const parts = session.reference.split('-');
        if (parts.length === 2 && parts[0] === 'REF') {
          // parts[1] might be "S001"
          if (parts[1].startsWith('S')) {
            this.planForm.get('reference')?.setValue(`REF-P${parts[1].substring(1)}`);
            return;
          }
        }
      }

      // Fallback to formation reference
      const formation = this.formations.find(f => f.formationId === fId);
      if (formation && formation.reference) {
        const parts = formation.reference.split('-');
        if (parts.length === 2 && parts[0] === 'REF') {
          this.planForm.get('reference')?.setValue(`REF-P${parts[1]}`);
        }
      }
    }
  }

  private loadResources(): void {
    this.formationService.getAll().subscribe(data => this.formations = data);
    this.sessionService.getAll().subscribe(data => this.sessions = data);
  }

  private initForm(): void {
    this.planForm = this.fb.group({
      reference: ['', [Validators.required, Validators.pattern(/^REF-P\d{3,}.*$/)]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      dateDebut: ['', [Validators.required, this.futureDateValidator()]],
      dateFin: ['', [Validators.required, this.futureDateValidator()]],
      etatplan: ['EN_PREPARATION', Validators.required],
      formationId: ['', Validators.required],
      sessionId: ['', Validators.required],
      seances: this.fb.array([])
    }, { validators: this.planValidator.bind(this) });
  }

  futureDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = new Date(control.value);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return { pastDate: true };
      }
      return null;
    };
  }

  get seances(): FormArray {
    return this.planForm.get('seances') as FormArray;
  }

  get filteredSessions(): Session[] {
    const fId = this.planForm.get('formationId')?.value;
    if (!fId) return [];
    return this.sessions.filter(s => s.formationId === fId);
  }

  get selectedFormationNbrSessions(): number | null {
    const fId = this.planForm.get('formationId')?.value;
    if (!fId) return null;
    const formation = this.formations.find(f => f.formationId === fId);
    return formation ? formation.nbrSessions : null;
  }

  ajouterSeance(): void {
    console.log('Adding seance...');
    const seanceForm = this.fb.group({
      titre: ['', Validators.required],
      date: ['', Validators.required],
      heure: ['', Validators.required],
      mode: ['PRESENTIEL', Validators.required],
      dureeEnHeures: [1, [Validators.required, Validators.min(1)]]
    });
    this.seances.push(seanceForm);
  }

  supprimerSeance(index: number): void {
    this.seances.removeAt(index);
  }

  planValidator(group: AbstractControl): ValidationErrors | null {
    const dateDebut = group.get('dateDebut')?.value;
    const dateFin = group.get('dateFin')?.value;
    const seances = group.get('seances')?.value as any[];

    if (!dateDebut || !dateFin) {
      return null;
    }

    const sDebut = new Date(dateDebut);
    const sFin = new Date(dateFin);

    if (sFin < sDebut) {
      return { datesInvalides: true };
    }

    if (seances && seances.length > 0) {
      const sessionId = group.get('sessionId')?.value;
      const session = this.sessions.find(s => s.id === sessionId);

      if (session) {
        const sDebut = new Date(session.dateDebut);
        const sFin = new Date(session.dateFin);
        sDebut.setHours(0, 0, 0, 0);
        sFin.setHours(0, 0, 0, 0);

        for (let s of seances) {
          if (s.date) {
            const dSeance = new Date(s.date);
            dSeance.setHours(0, 0, 0, 0);
            if (dSeance < sDebut || dSeance > sFin) {
              return { seanceHorsSession: true };
            }
          }
        }
      } else {
        // Fallback to plan dates if no session is selected yet (though sessionId is required)
        for (let s of seances) {
          if (s.date) {
            const dSeance = new Date(s.date);
            if (dSeance < sDebut || dSeance > sFin) {
              return { seanceHorsPlan: true };
            }
          }
        }
      }
    }

    // New validation: total duration of seances should not exceed formation duration
    const formationId = group.get('formationId')?.value;

    if (formationId && seances && seances.length > 0) {
      const formation = this.formations.find(f => f.formationId === formationId);
      if (formation) {
        let totalDuree = 0;
        for (let s of seances) {
          totalDuree += s.dureeEnHeures || 0;
        }
        if (totalDuree > formation.duree) {
          return { dureeTotaleExcedee: true };
        }
        // Global validation across all plans for this formation
        const otherPlans = this.allPlans.filter(p => 
          p.formationId === formationId && 
          p.planFormationId !== this.planId
        );
        
        const seancesAlreadyPlanned = otherPlans.reduce((sum, p) => sum + (p.seances?.length || 0), 0);
        const totalWithCurrent = seancesAlreadyPlanned + seances.length;

        if (totalWithCurrent > formation.nbrSessions) {
          return { 
            nombreSeancesExcedeGlobal: { 
              current: seances.length,
              other: seancesAlreadyPlanned,
              max: formation.nbrSessions
            } 
          };
        }
      }
    }

    return null;
  }

  private loadPlanData(id: string): void {
    this.isLoading = true;
    this.trainingPlanService.getById(id).subscribe({
      next: (plan) => {
        this.planForm.patchValue({
          reference: plan.reference,
          titre: plan.titre,
          dateDebut: plan.dateDebut ? plan.dateDebut.substring(0, 10) : '',
          dateFin: plan.dateFin ? plan.dateFin.substring(0, 10) : '',
          etatplan: plan.etatplan,
          formationId: plan.formationId,
          sessionId: plan.sessionId
        });

        if (plan.seances && plan.seances.length > 0) {
          this.seances.clear();
          plan.seances.forEach(seance => {
            this.seances.push(this.fb.group({
              titre: [seance.titre, Validators.required],
              date: [seance.date ? seance.date.substring(0, 10) : '', Validators.required],
              heure: [seance.heure || '', Validators.required],
              mode: [seance.mode || 'PRESENTIEL', Validators.required],
              dureeEnHeures: [seance.dureeEnHeures, [Validators.required, Validators.min(1)]]
            }));
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement', err);
        this.errorMessage = 'Impossible de charger les détails du plan.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      console.warn('Formulaire invalide !', this.planForm.errors);
      Object.keys(this.planForm.controls).forEach(key => {
        const controlErrors = this.planForm.get(key)?.errors;
        if (controlErrors) {
          console.log(`Erreur sur le champ "${key}":`, controlErrors);
        }
      });
      this.planForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formVal = this.planForm.value;

    // Check if a plan already exists for this formation to merge instead of creating a duplicate
    const existingPlan = this.allPlans.find(p => p.formationId === formVal.formationId);

    const seancesData = formVal.seances || [];

    if (!this.isEditMode && existingPlan) {
      // MERGE LOGIC: Add new seances and session to existing plan
      const updatedPlan: TrainingPlan = {
        ...existingPlan,
        seances: [...(existingPlan.seances || []), ...seancesData],
        // Ensure sessionIds list exists and contains the new session
        sessionIds: Array.from(new Set([...(existingPlan.sessionIds || []), formVal.sessionId])),
        // Update dates to cover the new session range
        dateDebut: this.getMinDate(existingPlan.dateDebut, formVal.dateDebut),
        dateFin: this.getMaxDate(existingPlan.dateFin, formVal.dateFin)
      };

      this.trainingPlanService.update(existingPlan.planFormationId!, updatedPlan).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
      return;
    }

    const planData: Partial<TrainingPlan> = {
      reference: formVal.reference,
      titre: formVal.titre,
      dateDebut: formVal.dateDebut,
      dateFin: formVal.dateFin,
      etatplan: formVal.etatplan,
      formationId: formVal.formationId,
      sessionId: formVal.sessionId,
      sessionIds: [formVal.sessionId], // Initialize the list
      seances: seancesData
    };

    if (this.isEditMode && this.planId) {
      this.trainingPlanService.update(this.planId, planData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    } else {
      this.trainingPlanService.create(planData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    }
  }

  private getMinDate(d1: string, d2: string): string {
    if (!d1) return d2;
    if (!d2) return d1;
    return new Date(d1) < new Date(d2) ? d1 : d2;
  }

  private getMaxDate(d1: string, d2: string): string {
    if (!d1) return d2;
    if (!d2) return d1;
    return new Date(d1) > new Date(d2) ? d1 : d2;
  }

  private onSuccess(): void {
    this.isSaving = false;
    this.closeForm.emit(true);
  }

  private onError(error: any): void {
    this.isSaving = false;
    console.error('Save error', error);
    this.errorMessage = 'Une erreur est survenue lors de l\'enregistrement.';
  }

  // --- Helpers for UI ---
  isFieldInvalid(fieldName: string): boolean {
    const field = this.planForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short'
    });
  }
}

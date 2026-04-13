import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/session';
import { FormationService } from '../../services/formation';
import { TrainingPlanService } from '../../services/training-plan.service';
import { EmployeService } from '../../services/employe.service';
import { Formation } from '../../models/formation';
import { TrainingPlan } from '../../models/training-plan';
import { Employe } from '../../models/employe';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-form.html',
  styleUrls: ['./session-form.css']
})
export class SessionFormComponent implements OnInit {
  @Input() sessionId: string | null = null;
  @Output() closeForm = new EventEmitter<boolean>();

  sessionForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  typeFormateur: 'INTERNE' | 'EXTERNE' = 'INTERNE';

  formations: Formation[] = [];
  trainingPlans: TrainingPlan[] = [];
  employes: Employe[] = [];

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private formationService: FormationService,
    private trainingPlanService: TrainingPlanService,
    private employeService: EmployeService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReferences();

    if (this.sessionId) {
      this.isEditMode = true;
      this.loadSessionData(this.sessionId);
    }
  }

  private initForm(): void {
    this.sessionForm = this.fb.group({
      // Formateur interne
      formateurInterneId: [''],
      // Formateur externe
      formateurExterneNom: [''],
      formateurExterneOrganisme: [''],
      // Communs
      description: ['', [Validators.required, Validators.maxLength(500)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      nbrDePlaces: [10, [Validators.required, Validators.min(1)]],
      formationId: ['', Validators.required],
      planFormationId: ['', Validators.required]
    });

    this.applyFormateurValidators();
  }

  setTypeFormateur(type: 'INTERNE' | 'EXTERNE'): void {
    this.typeFormateur = type;
    this.applyFormateurValidators();
    // Clear the other type's fields
    if (type === 'INTERNE') {
      this.sessionForm.get('formateurExterneNom')?.reset('');
      this.sessionForm.get('formateurExterneOrganisme')?.reset('');
    } else {
      this.sessionForm.get('formateurInterneId')?.reset('');
    }
  }

  private applyFormateurValidators(): void {
    const interneCtrl = this.sessionForm.get('formateurInterneId');
    const externeNomCtrl = this.sessionForm.get('formateurExterneNom');
    const externeOrgCtrl = this.sessionForm.get('formateurExterneOrganisme');

    if (this.typeFormateur === 'INTERNE') {
      interneCtrl?.setValidators([Validators.required]);
      externeNomCtrl?.clearValidators();
      externeOrgCtrl?.clearValidators();
    } else {
      interneCtrl?.clearValidators();
      externeNomCtrl?.setValidators([Validators.required, Validators.minLength(3)]);
      externeOrgCtrl?.setValidators([Validators.required, Validators.minLength(2)]);
    }

    interneCtrl?.updateValueAndValidity();
    externeNomCtrl?.updateValueAndValidity();
    externeOrgCtrl?.updateValueAndValidity();
  }

  private loadReferences(): void {
    this.formationService.getAll().subscribe({
      next: (data) => this.formations = data,
      error: (err) => console.error('Failed to load formations', err)
    });
    this.trainingPlanService.getAll().subscribe({
      next: (data) => this.trainingPlans = data,
      error: (err) => console.error('Failed to load plans', err)
    });
    this.employeService.getAll().subscribe({
      next: (data) => this.employes = data,
      error: (err) => console.error('Failed to load employees', err)
    });
  }

  private loadSessionData(id: string): void {
    this.isLoading = true;
    this.sessionService.getById(id).subscribe({
      next: (session) => {
        // Detect type from saved data
        if (session.typeFormateur === 'EXTERNE') {
          this.typeFormateur = 'EXTERNE';
        } else {
          this.typeFormateur = 'INTERNE';
        }
        this.applyFormateurValidators();

        this.sessionForm.patchValue({
          formateurInterneId: session.formateurInterneId || '',
          formateurExterneNom: session.formateurExterneNom || '',
          formateurExterneOrganisme: session.formateurExterneOrganisme || '',
          description: session.description,
          dateDebut: session.dateDebut ? session.dateDebut.substring(0, 10) : '',
          dateFin: session.dateFin ? session.dateFin.substring(0, 10) : '',
          nbrDePlaces: session.nbrDePlaces,
          formationId: session.formationId,
          planFormationId: session.planFormationId
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement', err);
        this.errorMessage = 'Impossible de charger les détails de la session.';
        this.isLoading = false;
      }
    });
  }

  getSelectedEmployeLabel(): string {
    const id = this.sessionForm.get('formateurInterneId')?.value;
    const emp = this.employes.find(e => e.utilisateurId === id);
    return emp ? `${emp.prenom} ${emp.nom}` : '';
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formVal = this.sessionForm.value;

    let formateurLabel = '';
    if (this.typeFormateur === 'INTERNE') {
      const emp = this.employes.find(e => e.utilisateurId === formVal.formateurInterneId);
      formateurLabel = emp ? `${emp.prenom} ${emp.nom}` : '';
    } else {
      formateurLabel = formVal.formateurExterneNom;
    }

    const sessionData: Session = {
      formateur: formateurLabel,
      typeFormateur: this.typeFormateur,
      formateurInterneId: this.typeFormateur === 'INTERNE' ? formVal.formateurInterneId : undefined,
      formateurExterneNom: this.typeFormateur === 'EXTERNE' ? formVal.formateurExterneNom : undefined,
      formateurExterneOrganisme: this.typeFormateur === 'EXTERNE' ? formVal.formateurExterneOrganisme : undefined,
      description: formVal.description,
      dateDebut: formVal.dateDebut,
      dateFin: formVal.dateFin,
      nbrDePlaces: formVal.nbrDePlaces,
      formationId: formVal.formationId,
      planFormationId: formVal.planFormationId
    };

    if (this.isEditMode && this.sessionId) {
      this.sessionService.update(this.sessionId, sessionData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    } else {
      this.sessionService.create(sessionData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    }
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.sessionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}

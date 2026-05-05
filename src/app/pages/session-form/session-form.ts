import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/session';
import { FormationService } from '../../services/formation';
import { EmployeService } from '../../services/employe.service';
import { Formation } from '../../models/formation';
import { Employe } from '../../models/employe';
import { OrganismeService } from '../../services/organisme.service';
import { FormateurExterneService } from '../../services/formateur-externe.service';
import { Organisme } from '../../models/organisme';
import { FormateurExterne } from '../../models/formateur-externe';

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
  employes: Employe[] = [];
  organismes: Organisme[] = [];
  formateursExternes: FormateurExterne[] = [];
  filteredFormateurs: FormateurExterne[] = [];
  selectedFormation: Formation | null = null;
  existingSessions: Session[] = [];

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private formationService: FormationService,
    private employeService: EmployeService,
    private organismeService: OrganismeService,
    private formateurService: FormateurExterneService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadReferences();

    if (this.sessionId) {
      this.isEditMode = true;
      this.loadSessionData(this.sessionId);
    }

    this.sessionForm.get('formationId')?.valueChanges.subscribe(formationId => {
      if (formationId) {
        this.selectedFormation = this.formations.find(f => f.formationId === formationId) || null;
        if (this.selectedFormation && !this.isEditMode) {
          // 1. Auto-Reference
          const ref = this.selectedFormation.reference;
          if (ref && ref.startsWith('REF-')) {
            const num = ref.split('-')[1];
            this.sessionForm.get('reference')?.setValue(`REF-S${num}`);
          }

          // 2. Auto-Title
          const count = this.existingSessions.filter(s => s.formationId === formationId).length;
          const nextIndex = count + 1;
          
          const maxSessions = this.selectedFormation.nbrSessions || 1;
          if (nextIndex > maxSessions) {
            this.errorMessage = `Attention: Cette formation ne prévoit que ${maxSessions} session(s). Vous dépassez la limite prévue.`;
          } else {
            this.errorMessage = '';
          }
          
          this.sessionForm.get('titre')?.setValue(`Session ${nextIndex}`);
        }
      } else {
        this.selectedFormation = null;
        this.errorMessage = '';
      }
    });

    this.sessionForm.get('organismeId')?.valueChanges.subscribe(orgId => {
      this.filteredFormateurs = this.formateursExternes.filter(f => f.organismeId === orgId);
      this.sessionForm.get('formateurExterneId')?.setValue('');
    });
  }

  private initForm(): void {
    this.sessionForm = this.fb.group({
      // Formateur interne
      formateurInterneId: [''],
      // Formateur externe
      organismeId: [''],
      formateurExterneId: [''],
      formateurExterneNom: [''],
      formateurExterneOrganisme: [''],
      // Communs
      reference: ['', [Validators.required, Validators.pattern(/^REF-S\d{3,}.*$/)]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      dateDebut: ['', [Validators.required, this.futureMonthValidator()]],
      dateFin: ['', [Validators.required, this.futureMonthValidator()]],
      nbrDePlaces: [10, [Validators.required, Validators.min(1)]],
      formationId: ['', Validators.required]
    }, { validators: this.sessionValidator.bind(this) });

    this.applyFormateurValidators();
  }

  sessionValidator(group: AbstractControl): ValidationErrors | null {
    const formationId = group.get('formationId')?.value;
    const dateDebut = group.get('dateDebut')?.value;
    const dateFin = group.get('dateFin')?.value;

    if (!dateDebut || !dateFin) {
      return null;
    }

    const sDebut = new Date(dateDebut);
    const sFin = new Date(dateFin);

    if (sFin < sDebut) {
      return { datesInvalides: true };
    }

    if (formationId && this.formations.length > 0) {
      const formation = this.formations.find(f => f.formationId === formationId);
      if (formation) {
        const fDebut = new Date(formation.dateDebut);
        const fFin = new Date(formation.dateFin);

        if (sDebut < fDebut || sFin > fFin) {
          return { horsDatesFormation: true };
        }

        // Check for overlap with other sessions of the same formation
        const overlap = this.existingSessions.find(s => {
          if (s.formationId !== formationId || s.id === this.sessionId) return false;
          const otherStart = new Date(s.dateDebut);
          const otherEnd = new Date(s.dateFin);
          return (sDebut <= otherEnd && otherStart <= sFin);
        });

        if (overlap) {
          return { chevauchementSession: overlap.titre || overlap.reference };
        }
      }
    }

    return null;
  }

  futureMonthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = new Date(control.value);
      const today = new Date();
      const selectedMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      if (selectedMonthStart < currentMonthStart) {
        return { pastMonth: true };
      }
      return null;
    };
  }

  setTypeFormateur(type: 'INTERNE' | 'EXTERNE'): void {
    this.typeFormateur = type;
    this.applyFormateurValidators();
    if (type === 'INTERNE') {
      this.sessionForm.get('organismeId')?.reset('');
      this.sessionForm.get('formateurExterneId')?.reset('');
    } else {
      this.sessionForm.get('formateurInterneId')?.reset('');
    }
  }

  private applyFormateurValidators(): void {
    const interneCtrl = this.sessionForm.get('formateurInterneId');
    const orgCtrl = this.sessionForm.get('organismeId');
    const extCtrl = this.sessionForm.get('formateurExterneId');

    if (this.typeFormateur === 'INTERNE') {
      interneCtrl?.setValidators([Validators.required]);
      orgCtrl?.clearValidators();
      extCtrl?.clearValidators();
    } else {
      interneCtrl?.clearValidators();
      orgCtrl?.setValidators([Validators.required]);
      extCtrl?.setValidators([Validators.required]);
    }

    interneCtrl?.updateValueAndValidity();
    orgCtrl?.updateValueAndValidity();
    extCtrl?.updateValueAndValidity();
  }

  private loadReferences(): void {
    this.formationService.getAll().subscribe({
      next: (data) => {
        this.formations = data;
        // If editing, find the selected formation after data is loaded
        if (this.isEditMode && this.sessionForm.get('formationId')?.value) {
          const fid = this.sessionForm.get('formationId')?.value;
          this.selectedFormation = this.formations.find(f => f.formationId === fid) || null;
        }
      },
      error: (err) => console.error('Failed to load formations', err)
    });

    this.employeService.getAll().subscribe({
      next: (data) => this.employes = data,
      error: (err) => console.error('Failed to load employees', err)
    });

    this.organismeService.getAll().subscribe({
      next: (data) => this.organismes = data,
      error: (err) => console.error('Failed to load organismes', err)
    });

    this.formateurService.getAll().subscribe({
      next: (data) => this.formateursExternes = data,
      error: (err) => console.error('Failed to load external trainers', err)
    });

    this.sessionService.getAll().subscribe({
      next: (data) => this.existingSessions = data,
      error: (err) => console.error('Failed to load existing sessions', err)
    });
  }

  private loadSessionData(id: string): void {
    this.isLoading = true;
    this.sessionService.getById(id).subscribe({
      next: (session) => {
        if (session.typeFormateur === 'EXTERNE') {
          this.typeFormateur = 'EXTERNE';
        } else {
          this.typeFormateur = 'INTERNE';
        }
        this.applyFormateurValidators();

        this.sessionForm.patchValue({
          formateurInterneId: session.formateurInterneId || '',
          organismeId: session.organismeId || '',
          formateurExterneId: session.formateurExterneId || '',
          reference: session.reference || '',
          titre: session.titre || '',
          description: session.description,
          dateDebut: session.dateDebut ? session.dateDebut.substring(0, 10) : '',
          dateFin: session.dateFin ? session.dateFin.substring(0, 10) : '',
          nbrDePlaces: session.nbrDePlaces,
          formationId: session.formationId
        });

        this.isLoading = false;
        if (session.formationId) {
          this.selectedFormation = this.formations.find(f => f.formationId === session.formationId) || null;
        }
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
      const trainer = this.formateursExternes.find(f => f.id === formVal.formateurExterneId);
      formateurLabel = trainer ? `${trainer.prenom} ${trainer.nom}` : '';
    }

    const sessionData: Session = {
      formateur: formateurLabel,
      typeFormateur: this.typeFormateur,
      formateurInterneId: this.typeFormateur === 'INTERNE' ? formVal.formateurInterneId : undefined,
      organismeId: this.typeFormateur === 'EXTERNE' ? formVal.organismeId : undefined,
      formateurExterneId: this.typeFormateur === 'EXTERNE' ? formVal.formateurExterneId : undefined,
      formateurExterneNom: this.typeFormateur === 'EXTERNE' ? 
        this.formateursExternes.find(f => f.id === formVal.formateurExterneId)?.nom : undefined,
      formateurExterneOrganisme: this.typeFormateur === 'EXTERNE' ? 
        this.organismes.find(o => o.organismeId === formVal.organismeId)?.nom : undefined,
      reference: formVal.reference,
      titre: formVal.titre,
      description: formVal.description,
      dateDebut: formVal.dateDebut,
      dateFin: formVal.dateFin,
      nbrDePlaces: formVal.nbrDePlaces,
      formationId: formVal.formationId
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

  getSuggestedDuration(): number {
    if (!this.selectedFormation || !this.selectedFormation.nbrSessions) return 0;
    const start = new Date(this.selectedFormation.dateDebut);
    const end = new Date(this.selectedFormation.dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / this.selectedFormation.nbrSessions);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

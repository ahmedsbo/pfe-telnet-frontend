import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormationService } from '../../services/formation';
import { Formation } from '../../models/formation';

@Component({
  selector: 'app-formation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formation-form.html',
  styleUrls: ['./formation-form.css']
})
export class FormationFormComponent implements OnInit {
  @Input() formationId: string | null = null;
  @Input() existingFormations: Formation[] = [];
  @Output() closeForm = new EventEmitter<boolean>();

  formationForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  typesFormation = ['INTERNE', 'EXTERNE'];
  etatsFormation = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

  constructor(
    private fb: FormBuilder,
    private formationService: FormationService
  ) { }

  ngOnInit(): void {
    this.initForm();

    if (this.formationId) {
      this.isEditMode = true;
      this.loadFormationData(this.formationId);
    } else {
      this.generateNextReference();
    }
  }

  private generateNextReference(): void {
    if (!this.existingFormations || this.existingFormations.length === 0) {
      this.formationForm.patchValue({ reference: 'REF-001' });
      return;
    }

    const references = this.existingFormations
      .map(f => f.reference)
      .filter(ref => /^REF-\d+$/.test(ref));

    if (references.length === 0) {
      this.formationForm.patchValue({ reference: 'REF-001' });
      return;
    }

    const maxNumber = Math.max(...references.map(ref => {
      const match = ref.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }));

    const nextNumber = maxNumber + 1;
    const nextReference = `REF-${nextNumber.toString().padStart(3, '0')}`;
    this.formationForm.patchValue({ reference: nextReference });
  }

  private initForm(): void {
    this.formationForm = this.fb.group({
      reference: ['', [Validators.required, Validators.pattern(/^REF-\d{3,}$/), this.uniqueReferenceValidator()]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      dateDebut: ['', [Validators.required, this.futureDateValidator()]],
      dateFin: ['', [Validators.required, this.futureDateValidator()]],
      duree: [1, [Validators.required, Validators.min(1)]],
      nbrSessions: [1, [Validators.required, Validators.min(1)]],
      typeFormation: ['INTERNE', Validators.required],
      etatformation: ['PLANIFIEE', Validators.required]
    });
  }

  uniqueReferenceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const reference = control.value.trim();
      const isDuplicate = this.existingFormations.some(f => f.reference === reference && f.formationId !== this.formationId);
      
      return isDuplicate ? { notUnique: true } : null;
    };
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

  private loadFormationData(id: string): void {
    this.isLoading = true;
    this.formationService.getById(id).subscribe({
      next: (formation) => {
        this.formationForm.patchValue({
          reference: formation.reference,
          titre: formation.titre,
          description: formation.description,
          dateDebut: formation.dateDebut ? formation.dateDebut.substring(0, 10) : '',
          dateFin: formation.dateFin ? formation.dateFin.substring(0, 10) : '',
          duree: formation.duree,
          nbrSessions: formation.nbrSessions || 1,
          typeFormation: formation.typeFormation,
          etatformation: formation.etatformation
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement', err);
        this.errorMessage = 'Impossible de charger les détails de la formation.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.formationForm.invalid) {
      this.formationForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formationData: Formation = this.formationForm.value;

    if (this.isEditMode && this.formationId) {
      this.formationService.update(this.formationId, formationData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    } else {
      this.formationService.create(formationData).subscribe({
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
    const field = this.formationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}

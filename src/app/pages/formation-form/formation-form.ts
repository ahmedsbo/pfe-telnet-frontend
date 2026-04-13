import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  @Output() closeForm = new EventEmitter<boolean>();

  formationForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  typesFormation = ['INTERNE', 'EXTERNE', 'EN_LIGNE', 'HYBRIDE'];
  etatsFormation = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

  constructor(
    private fb: FormBuilder,
    private formationService: FormationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    if (this.formationId) {
      this.isEditMode = true;
      this.loadFormationData(this.formationId);
    }
  }

  private initForm(): void {
    this.formationForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      duree: [1, [Validators.required, Validators.min(1)]],
      typeFormation: ['INTERNE', Validators.required],
      etatformation: ['PLANIFIEE', Validators.required]
    });
  }

  private loadFormationData(id: string): void {
    this.isLoading = true;
    this.formationService.getById(id).subscribe({
      next: (formation) => {
        this.formationForm.patchValue({
          titre: formation.titre,
          description: formation.description,
          dateDebut: formation.dateDebut ? formation.dateDebut.substring(0, 10) : '',
          dateFin: formation.dateFin ? formation.dateFin.substring(0, 10) : '',
          duree: formation.duree,
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

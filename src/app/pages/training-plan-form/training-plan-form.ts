import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrainingPlanService } from '../../services/training-plan.service';
import { EtatPlan, TrainingPlan } from '../../models/training-plan';

@Component({
  selector: 'app-training-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './training-plan-form.html',
  styleUrls: ['./training-plan-form.css']
})
export class TrainingPlanFormComponent implements OnInit {
  @Input() planId: string | null = null;
  @Output() closeForm = new EventEmitter<boolean>();
  
  planForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  etatsPlan: EtatPlan[] = ['EN_PREPARATION', 'EN_VALIDATION', 'VALIDE', 'CLOTURE'];

  constructor(
    private fb: FormBuilder,
    private trainingPlanService: TrainingPlanService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    if (this.planId) {
      this.isEditMode = true;
      this.loadPlanData(this.planId);
    }
  }

  private initForm(): void {
    this.planForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      etatplan: ['EN_PREPARATION', Validators.required]
    });
  }

  private loadPlanData(id: string): void {
    this.isLoading = true;
    this.trainingPlanService.getById(id).subscribe({
      next: (plan) => {
        this.planForm.patchValue({
          titre: plan.titre,
          // Convert to YYYY-MM-DD for input type="date" if it's not already
          dateDebut: plan.dateDebut ? plan.dateDebut.substring(0, 10) : '',
          dateFin: plan.dateFin ? plan.dateFin.substring(0, 10) : '',
          etatplan: plan.etatplan
        });
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
      this.planForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const planData: Partial<TrainingPlan> = this.planForm.value;

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
}

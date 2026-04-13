export type EtatPlan = 'EN_PREPARATION' | 'EN_VALIDATION' | 'VALIDE' | 'CLOTURE';

export interface TrainingPlan {
  planFormationId?: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  etatplan: EtatPlan;
  sessionIds?: string[];
}

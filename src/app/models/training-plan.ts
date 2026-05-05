export type EtatPlan = 'EN_PREPARATION' | 'EN_VALIDATION' | 'VALIDE' | 'CLOTURE';

export type ModeSeance = 'PRESENTIEL' | 'EN_LIGNE' | 'HYBRIDE';

export interface Seance {
  titre: string;
  date: string;
  heure: string;
  dureeEnHeures: number;
  mode: ModeSeance;
}

export interface TrainingPlan {
  planFormationId?: string;
  reference: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  etatplan: EtatPlan;
  formationId?: string;
  sessionId?: string;
  sessionIds?: string[];
  seances?: Seance[];
}

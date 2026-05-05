export interface Evaluation {
  id?: string;
  dateEvaluation: string;
  titre: string;
  formateur: string;
  formationId: string;
  type: 'CHAUD' | 'FROID';
}

export interface EvaluationAChaud extends Evaluation {
  ameliorationExterne: string;

}

export interface EvaluationAFroid extends Evaluation {
  ameliorationInterne: string;
}

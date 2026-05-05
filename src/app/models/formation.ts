export interface Formation {

  formationId?: string;
  reference: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  duree: number;
  nbrSessions: number;
  typeFormation: 'INTERNE' | 'EXTERNE';
  etatformation: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

}

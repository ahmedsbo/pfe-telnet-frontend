export interface Session {
  id?: string;
  dateDebut: string;
  dateFin: string;
  formateur: string;
  typeFormateur?: 'INTERNE' | 'EXTERNE';
  formateurInterneId?: string;
  formateurExterneNom?: string;
  formateurExterneOrganisme?: string;
  nbrDePlaces: number;
  description: string;
  formationId?: string;
  planFormationId?: string;
}

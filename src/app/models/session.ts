export interface Session {
  id?: string;
  reference: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  formateur: string;
  typeFormateur?: 'INTERNE' | 'EXTERNE';
  formateurInterneId?: string;
  formateurExterneNom?: string;
  formateurExterneOrganisme?: string;
  formateurExterneId?: string;
  organismeId?: string;
  nbrDePlaces: number;
  description: string;
  formationId?: string;
}

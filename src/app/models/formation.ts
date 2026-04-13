export interface Formation {

    formationId?: string;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    duree: number;
    typeFormation: 'INTERNE' | 'EXTERNE' | 'EN_LIGNE' | 'HYBRIDE' ;
    etatformation: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';


  }

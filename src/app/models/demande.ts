export interface Demande {
    demandeId?: string;
    dateDemande: string;
    demandeur: string;
    titre: string;
    etatDemande: string;
    formationId?: string;
    planFormationId?: string;
    utilisateurId?: string;
    reference?: string;
}

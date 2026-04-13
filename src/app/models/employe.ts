export interface Employe {
  utilisateurId?: string;
  nom: string;
  prenom: string;
  email?: string;
  matricule?: string;
  role?: 'ADMIN' | 'RH' | 'COLLABORATEUR';
  tel?: string;
  metier?: string;
  adresse?: string;
}

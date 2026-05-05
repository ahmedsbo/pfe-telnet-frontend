import { Component, OnInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { OrganismeService } from '../../services/organisme.service';
import { FormateurExterneService } from '../../services/formateur-externe.service';
import { Organisme } from '../../models/organisme';
import { FormateurExterne } from '../../models/formateur-externe';

@Component({
  selector: 'app-organismes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organismes.html',
  styleUrl: './organismes.css'
})
export class OrganismesComponent implements OnInit, OnDestroy {
  organismes: Organisme[] = [];
  formateurs: FormateurExterne[] = [];
  
  selectedOrganisme: Organisme | null = null;
  showOrganismeForm = false;
  showFormateurForm = false;
  
  currentOrganisme: Organisme = this.initOrganisme();
  currentFormateur: FormateurExterne = this.initFormateur();

  private routerSubscription?: Subscription;
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private organismeService: OrganismeService,
    private formateurService: FormateurExterneService
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadOrganismes();
      this.loadFormateurs();
    });
  }

  ngOnInit(): void {
    this.loadOrganismes();
    this.loadFormateurs();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  initOrganisme(): Organisme {
    return { nom: '', adresse: '', telephone: '', email: '', siteInternet: '' };
  }

  initFormateur(): FormateurExterne {
    return { nom: '', prenom: '', email: '', telephone: '', organismeId: '' };
  }

  loadOrganismes(): void {
    this.organismeService.getAll().subscribe(data => {
      this.organismes = data;
      this.cdr.detectChanges();
    });
  }

  loadFormateurs(): void {
    this.formateurService.getAll().subscribe(data => {
      this.formateurs = data;
      this.cdr.detectChanges();
    });
  }

  getFormateursByOrganisme(organismeId: string): FormateurExterne[] {
    return this.formateurs.filter(f => f.organismeId === organismeId);
  }

  // Organisme Actions
  openOrganismeForm(organisme?: Organisme): void {
    this.currentOrganisme = organisme ? { ...organisme } : this.initOrganisme();
    this.showOrganismeForm = true;
  }

  saveOrganisme(): void {
    if (this.currentOrganisme.organismeId) {
      this.organismeService.update(this.currentOrganisme.organismeId, this.currentOrganisme)
        .subscribe(() => {
          this.loadOrganismes();
          this.showOrganismeForm = false;
        });
    } else {
      this.organismeService.create(this.currentOrganisme)
        .subscribe(() => {
          this.loadOrganismes();
          this.showOrganismeForm = false;
        });
    }
  }

  deleteOrganisme(id: string): void {
    if (confirm('Supprimer cet organisme et tous ses formateurs ?')) {
      this.organismeService.delete(id).subscribe(() => this.loadOrganismes());
    }
  }

  // Formateur Actions
  openFormateurForm(organismeId: string, formateur?: FormateurExterne): void {
    this.currentFormateur = formateur ? { ...formateur } : this.initFormateur();
    this.currentFormateur.organismeId = organismeId;
    this.showFormateurForm = true;
  }

  saveFormateur(): void {
    if (this.currentFormateur.id) {
      this.formateurService.update(this.currentFormateur.id, this.currentFormateur)
        .subscribe(() => {
          this.loadFormateurs();
          this.showFormateurForm = false;
        });
    } else {
      this.formateurService.create(this.currentFormateur)
        .subscribe(() => {
          this.loadFormateurs();
          this.showFormateurForm = false;
        });
    }
  }

  deleteFormateur(id: string): void {
    if (confirm('Supprimer ce formateur ?')) {
      this.formateurService.delete(id).subscribe(() => this.loadFormateurs());
    }
  }
}

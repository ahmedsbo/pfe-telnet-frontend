import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { authGuard } from './guards/auth-guard';
import { LayoutComponent } from './layout/layout';

export const routes: Routes = [

  // Pages publiques (sans sidebar/navbar)
  { path: '',         component: Home },
  { path: 'login',    component: Login },
  { path: 'register', component: Register },

  // Pages protégées (avec sidebar + navbar via LayoutComponent)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'training-plans',
        loadComponent: () =>
          import('./pages/training-plan/training-plan').then(m => m.TrainingPlanComponent)
      },
      {
        path: 'training-plans/ajouter',
        loadComponent: () =>
          import('./pages/training-plan-form/training-plan-form').then(m => m.TrainingPlanFormComponent)
      },
      {
        path: 'training-plans/modifier/:id',
        loadComponent: () =>
          import('./pages/training-plan-form/training-plan-form').then(m => m.TrainingPlanFormComponent)
      },
      {
        path: 'formations',
        loadComponent: () =>
          import('./pages/formations/formations').then(m => m.Formations)
      },
      {
        path: 'formations/ajouter',
        loadComponent: () =>
           import('./pages/formation-form/formation-form').then(m => m.FormationFormComponent)
      },
      {
        path: 'formations/modifier/:id',
        loadComponent: () =>
           import('./pages/formation-form/formation-form').then(m => m.FormationFormComponent)
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./pages/sessions/sessions').then(m => m.SessionsComponent)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];

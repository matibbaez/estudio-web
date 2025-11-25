import { Routes } from '@angular/router';

// 1. IMPORTAMOS LOS COMPONENTES
import { InicioComponent } from './pages/inicio/inicio';
import { IniciarReclamoComponent } from './pages/iniciar-reclamo/iniciar-reclamo';
import { ConsultarTramiteComponent } from './pages/consultar-tramite/consultar-tramite';
import { LoginComponent } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard'; // <-- ¡NUEVO!

import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  { 
    path: '', 
    component: InicioComponent, 
    pathMatch: 'full',
    data: { animation: 'InicioPage' }
  },
  { 
    path: 'iniciar-reclamo', 
    component: IniciarReclamoComponent,
    data: { animation: 'IniciarPage' } 
  },
  { 
    path: 'consultar-tramite', 
    component: ConsultarTramiteComponent,
    data: { animation: 'ConsultarPage' } 
  },
  { 
    path: 'login', 
    component: LoginComponent,
    data: { animation: 'LoginPage' } 
  },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard],
    data: { animation: 'AdminPage' } 
  },
  
  { path: '**', redirectTo: '' } 
];
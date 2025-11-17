import { Routes } from '@angular/router';

// 1. IMPORTAMOS LOS COMPONENTES
import { InicioComponent } from './pages/inicio/inicio';
import { IniciarReclamoComponent } from './pages/iniciar-reclamo/iniciar-reclamo';
import { ConsultarTramiteComponent } from './pages/consultar-tramite/consultar-tramite';
import { LoginComponent } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard'; // <-- ¡NUEVO!

import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  // --- Rutas Públicas ---
  { path: '', component: InicioComponent, pathMatch: 'full' },
  { path: 'iniciar-reclamo', component: IniciarReclamoComponent },
  { path: 'consultar-tramite', component: ConsultarTramiteComponent },
  { path: 'login', component: LoginComponent },

  // ------------------------------------------
  // RUTA PRIVADA PARA EL ADMIN
  // ------------------------------------------
  { 
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard] 
  },
  
  { path: '**', redirectTo: '' } 
];
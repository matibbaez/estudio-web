import { Routes } from '@angular/router';

// 1. Importamos los componentes (¡con 'InicioComponent'!)
import { InicioComponent } from './pages/inicio/inicio'; // <--- ESTE ES TU CAMBIO
import { IniciarReclamoComponent } from './pages/iniciar-reclamo/iniciar-reclamo';
import { ConsultarTramiteComponent } from './pages/consultar-tramite/consultar-tramite';

export const routes: Routes = [
  // Ruta principal (Home)
  { path: '', component: InicioComponent, pathMatch: 'full' }, 
  
  // Ruta para el formulario de inicio
  { path: 'iniciar-reclamo', component: IniciarReclamoComponent },
  
  // Ruta para consultar
  { path: 'consultar-tramite', component: ConsultarTramiteComponent },
  
  // Un "catch-all"
  { path: '**', redirectTo: '' } 
];
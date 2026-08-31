import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamosService } from '../../services/reclamos.service';
import { CardComponent } from '../../components/card/card';
import { GestionarReclamoModalComponent } from '../../components/gestionar-reclamo-modal/gestionar-reclamo-modal';

export interface IReclamo {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  codigo_seguimiento: string;
  estado: 'Recibido' | 'En Proceso' | 'Finalizado';
  fecha_creacion: string;
  
  // Archivos Base
  path_dni: string;
  path_recibo: string;
  path_form_srt: string; // <-- UNIFICADO
  
  // Archivos Opcionales
  path_alta_medica?: string;
  path_carta_documento?: string;
  path_revoca_patrocinio?: string;
  
  // Datos Lógicos
  tipo_tramite: string;
  subtipo_tramite?: string;
  tiene_abogado_anterior?: boolean; 

  // Datos Texto (Rechazo)
  jornada_laboral?: string;
  direccion_laboral?: string;
  trayecto_habitual?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, GestionarReclamoModalComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private reclamosService = inject(ReclamosService);

  // Variables de Datos
  ordenDescendente = true;
  reclamosOriginales: IReclamo[] = []; 
  reclamosFiltrados: IReclamo[] = [];  
  loading = true;

  // Variables de Filtro
  filtroEstado: string = ''; 
  filtroTipo: string = '';   

  // Variables Modal
  reclamoSeleccionado: IReclamo | null = null;
  actualizandoId: string | null = null;

  ngOnInit() {
    this.cargarDatos();
  }

  alternarOrden() {
    this.ordenDescendente = !this.ordenDescendente;
    this.aplicarFiltrosLocales(); 
  }

  filtrosAbiertos = false;

  toggleFiltros() {
    this.filtrosAbiertos = !this.filtrosAbiertos;
  }

  cargarDatos() {
    this.loading = true;
    this.reclamosService.findAll(this.filtroEstado).subscribe({
      next: (data) => {
        this.reclamosOriginales = data as IReclamo[];
        this.aplicarFiltrosLocales(); 
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando reclamos', err);
        this.loading = false;
      }
    });
  }

  aplicarFiltrosLocales() {
    let resultado = [];

    if (!this.filtroTipo) {
      resultado = [...this.reclamosOriginales]; 
    } else {
      if (this.filtroTipo === 'Revoca') {
        resultado = this.reclamosOriginales.filter(r => !!r.path_revoca_patrocinio);
      } else {
        resultado = this.reclamosOriginales.filter(r => r.tipo_tramite === this.filtroTipo);
      }
    }

    resultado.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion).getTime();
      const fechaB = new Date(b.fecha_creacion).getTime();

      return this.ordenDescendente 
        ? fechaB - fechaA  
        : fechaA - fechaB; 
    });

    this.reclamosFiltrados = resultado;
  }

  cambiarEstado(nuevoEstado: string) {
    this.filtroEstado = nuevoEstado;
    this.cargarDatos(); 
  }

  cambiarTipo(event: any) {
    this.filtroTipo = event.target.value;
    this.aplicarFiltrosLocales(); 
  }

  abrirModal(reclamo: IReclamo) {
    this.reclamoSeleccionado = reclamo;
  }

  cerrarModal() {
    this.reclamoSeleccionado = null;
  }

  guardarCambiosModal(nuevoEstado: 'Recibido' | 'En Proceso' | 'Finalizado') {
    if (!this.reclamoSeleccionado) return;
    
    const id = this.reclamoSeleccionado.id;
    this.actualizandoId = id;
    this.cerrarModal(); 
    
    this.reclamosService.update(id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.actualizandoId = null;
        this.cargarDatos(); 
      },
      error: (err) => {
        console.error('Error actualizando', err);
        this.actualizandoId = null;
      }
    });
  }
}
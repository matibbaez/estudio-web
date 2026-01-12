import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamosService } from '../../services/reclamos.service';
import { CardComponent } from '../../components/card/card';
import { GestionarReclamoModalComponent } from '../../components/gestionar-reclamo-modal/gestionar-reclamo-modal';

// Interfaz completa con todos los campos nuevos
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
  path_form1: string;
  path_form2: string;
  
  // Archivos Opcionales
  path_alta_medica?: string;
  path_carta_documento?: string;
  path_revoca_patrocinio?: string;
  
  // Datos Lógicos
  tipo_tramite: string;
  subtipo_tramite?: string;
  tiene_abogado_anterior?: boolean; // Llega como boolean de la BD

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
  filtroEstado: string = ''; // '' = Todos
  filtroTipo: string = '';   // '' = Todos

  // Variables Modal
  reclamoSeleccionado: IReclamo | null = null;
  actualizandoId: string | null = null;

  ngOnInit() {
    this.cargarDatos();
  }

  alternarOrden() {
    this.ordenDescendente = !this.ordenDescendente;
    this.aplicarFiltrosLocales(); // Re-aplicamos filtros y orden
  }

  filtrosAbiertos = false;

  toggleFiltros() {
    this.filtrosAbiertos = !this.filtrosAbiertos;
  }

  // 1. Carga desde Backend (Filtra por ESTADO)
  cargarDatos() {
    this.loading = true;
    this.reclamosService.findAll(this.filtroEstado).subscribe({
      next: (data) => {
        this.reclamosOriginales = data as IReclamo[];
        this.aplicarFiltrosLocales(); // Aplicamos el filtro de tipo
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando reclamos', err);
        this.loading = false;
      }
    });
  }

  // 2. Filtro Local (Filtra por TIPO)
  aplicarFiltrosLocales() {
    let resultado = [];

    // 1. Filtrado
    if (!this.filtroTipo) {
      resultado = [...this.reclamosOriginales]; // Copia
    } else {
      if (this.filtroTipo === 'Revoca') {
        resultado = this.reclamosOriginales.filter(r => !!r.path_revoca_patrocinio);
      } else {
        resultado = this.reclamosOriginales.filter(r => r.tipo_tramite === this.filtroTipo);
      }
    }

    // 2. Ordenamiento (Sorting)
    resultado.sort((a, b) => {
      // Convertimos strings de fecha a objetos Date para comparar
      const fechaA = new Date(a.fecha_creacion).getTime();
      const fechaB = new Date(b.fecha_creacion).getTime();

      return this.ordenDescendente 
        ? fechaB - fechaA  // Descendente (Recientes arriba)
        : fechaA - fechaB; // Ascendente (Antiguos arriba)
    });

    this.reclamosFiltrados = resultado;
  }

  // Eventos de UI
  cambiarEstado(nuevoEstado: string) {
    this.filtroEstado = nuevoEstado;
    this.cargarDatos(); 
  }

  cambiarTipo(event: any) {
    this.filtroTipo = event.target.value;
    this.aplicarFiltrosLocales(); 
  }

  // Modal
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
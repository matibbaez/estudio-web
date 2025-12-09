import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamosService } from '../../services/reclamos.service';
import { CardComponent } from '../../components/card/card';
import { GestionarReclamoModalComponent } from '../../components/gestionar-reclamo-modal/gestionar-reclamo-modal';

// Interfaz (Agregamos los campos opcionales)
export interface IReclamo {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  codigo_seguimiento: string;
  estado: 'Recibido' | 'En Proceso' | 'Finalizado';
  fecha_creacion: string;
  
  // Archivos
  path_dni: string;
  path_recibo: string;
  path_form1: string;
  path_form2: string;
  path_alta_medica?: string;
  
  // Nuevos
  tipo_tramite: string;
  subtipo_tramite?: string;
  path_carta_documento?: string;
  path_revoca_patrocinio?: string;
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
  reclamosOriginales: IReclamo[] = []; // Todos los que trajo el backend
  reclamosFiltrados: IReclamo[] = [];  // Los que mostramos en pantalla
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
    if (!this.filtroTipo) {
      this.reclamosFiltrados = this.reclamosOriginales;
    } else {
      if (this.filtroTipo === 'Revoca') {
        // Lógica especial para Revoca (busca si tiene archivo)
        this.reclamosFiltrados = this.reclamosOriginales.filter(r => !!r.path_revoca_patrocinio);
      } else {
        // Lógica normal por nombre de tipo
        this.reclamosFiltrados = this.reclamosOriginales.filter(r => r.tipo_tramite === this.filtroTipo);
      }
    }
  }

  // Eventos de UI
  cambiarEstado(nuevoEstado: string) {
    this.filtroEstado = nuevoEstado;
    this.cargarDatos(); // Recarga del backend
  }

  cambiarTipo(event: any) {
    this.filtroTipo = event.target.value;
    this.aplicarFiltrosLocales(); // Filtra en memoria (rápido)
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
    this.cerrarModal(); // Cerramos visualmente rápido
    
    this.reclamosService.update(id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.actualizandoId = null;
        this.cargarDatos(); // Refrescamos la tabla
      },
      error: (err) => {
        console.error('Error actualizando', err);
        this.actualizandoId = null;
      }
    });
  }
}
import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IReclamo } from '../../pages/admin-dashboard/admin-dashboard';
import { NotificacionService } from '../../services/notificacion';

// Actualizado para reflejar el backend: formSRT
type TipoArchivo = 'dni' | 'recibo' | 'alta' | 'formSRT' | 'carta_documento' | 'revoca';

@Component({
  selector: 'app-gestionar-reclamo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-reclamo-modal.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestionar-reclamo-modal.scss'
})
export class GestionarReclamoModalComponent implements OnInit {

  @Input() reclamo!: IReclamo; 
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private notificacionService = inject(NotificacionService);

  // Bandera para el spinner de descarga
  public descargando: TipoArchivo | null = null;

  estadoForm = this.fb.group({
    estado: ['', Validators.required]
  });

  constructor() {}

  ngOnInit(): void {
    if (this.reclamo) {
      this.estadoForm.patchValue({ estado: this.reclamo.estado });
    }
  }

  // ------------------------------------------------------------------
  // MÉTODO PARA DESCARGAR ARCHIVOS (Con environment)
  // ------------------------------------------------------------------
  descargarArchivo(tipo: TipoArchivo) {
    if (this.descargando) return; 

    this.descargando = tipo; 
    
    const url = `${environment.apiUrl}/reclamos/descargar/${this.reclamo.id}/${tipo}`;

    this.http.get<{ url: string }>(url).pipe(
      finalize(() => {
        this.descargando = null; 
      })
    ).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al descargar archivo:', error);
        
        if (error.status === 404) {
           this.notificacionService.showError('El archivo solicitado no se encuentra en el servidor.');
        } else {
           this.notificacionService.showError('Error al generar el link de descarga.');
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // GUARDAR CAMBIOS (ESTADO)
  // ------------------------------------------------------------------
  guardarCambios() {
    if (this.estadoForm.valid) {
      this.save.emit(this.estadoForm.value.estado as string);
    }
  }

  cerrarModal() {
    this.close.emit();
  }
}
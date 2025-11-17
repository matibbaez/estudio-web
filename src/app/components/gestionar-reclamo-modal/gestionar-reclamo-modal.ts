import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IReclamo } from '../../pages/admin-dashboard/admin-dashboard';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // 1. ¡IMPORTAR HTTPCLIENT!
import { NotificacionService } from '../../services/notificacion'; // 2. ¡IMPORTAR NOTIFICACION!
import { finalize } from 'rxjs/operators';

// 3. (PRO) Creamos un "tipo" para los nombres de archivo
type TipoArchivo = 'dni' | 'recibo' | 'alta' | 'form1' | 'form2';

@Component({
  selector: 'app-gestionar-reclamo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-reclamo-modal.html',
  styleUrl: './gestionar-reclamo-modal.scss'
})
export class GestionarReclamoModalComponent implements OnInit {

  @Input() reclamo!: IReclamo; 
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<'Recibido' | 'En Proceso' | 'Finalizado'>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); // 4. ¡INYECTAR!
  private notificacionService = inject(NotificacionService); // 5. ¡INYECTAR!

  // 6. ¡NUEVA! Bandera para el spinner de descarga
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
  // ¡NUEVO MÉTODO PARA DESCARGAR ARCHIVOS!
  // ------------------------------------------------------------------
  descargarArchivo(tipo: TipoArchivo) {
    if (this.descargando) return; // Si ya está descargando, no hace nada

    this.descargando = tipo; // ¡Activamos el spinner!
    const url = `http://localhost:3000/reclamos/descargar/${this.reclamo.id}/${tipo}`;

    // ¡La llamada GET! El 'jwtInterceptor' pone el token solo
    this.http.get<{ url: string }>(url).pipe(
      finalize(() => {
        this.descargando = null; // ¡Apagamos el spinner (al final, éxito o error)!
      })
    ).subscribe({
      next: (response) => {
        // ¡ÉXITO! Abrimos el link temporal de Supabase en una pestaña nueva
        window.open(response.url, '_blank');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al descargar archivo:', error);
        this.notificacionService.showError('Error al generar el link de descarga.');
      }
    });
  }
  // ------------------------------------------------------------------

  // (Las funciones 'guardarCambios' y 'cerrarModal' quedan 100% igual)
  guardarCambios() {
    if (this.estadoForm.valid) {
      this.save.emit(this.estadoForm.value.estado as 'Recibido' | 'En Proceso' | 'Finalizado');
    }
  }
  cerrarModal() {
    this.close.emit();
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

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
  path_form_srt: string; // <-- UNIFICADO
  path_alta_medica?: string;
  
  // Nuevos campos
  tipo_tramite: string;
  subtipo_tramite?: string;
  path_carta_documento?: string;
  path_revoca_patrocinio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReclamosService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reclamos`; 

  constructor() { }

  findAll(estado?: string): Observable<IReclamo[]> {
    let url = this.apiUrl;
    if (estado) {
      url += `?estado=${estado}`;
    }
    return this.http.get<IReclamo[]>(url);
  }

  update(id: string, body: { estado: string }): Observable<IReclamo> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.patch<IReclamo>(url, body);
  }
}
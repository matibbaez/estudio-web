import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service'; // Importamos el servicio

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inicio.scss'
})
export class InicioComponent implements OnInit {

  // Inyectamos el servicio de SEO en el constructor
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    // Disparamos las etiquetas apenas carga el componente
    this.seoService.generarTags({
      title: 'ReclamARTe | Plataforma de Gestión Legal',
      description: 'Iniciá tu reclamo de ART de forma rápida, segura y 100% online. Simplificamos el proceso legal sin vueltas ni burocracia.',
      image: 'https://reclamarte.ar/logo-seo-compartir.png', // URL absoluta con tu dominio
      url: 'https://reclamarte.ar/'
    });
  }

  // Datos de las preguntas frecuentes
  faqs = [
    {
      pregunta: '¿Qué documentos necesito para iniciar?',
      respuesta: 'Para la mayoría de los trámites, necesitarás tu DNI (frente y dorso), tu último recibo de sueldo y, si corresponde, el alta médica. El sistema te guiará paso a paso.',
      abierta: false
    },
    {
      pregunta: '¿Cómo sé en qué estado está mi trámite?',
      respuesta: 'Al finalizar la carga, recibirás un "Código de Seguimiento" único (ej. A1B2C3). Podés ingresarlo en la sección "Consultar Trámite" para ver el estado en tiempo real.',
      abierta: false
    },
    {
      pregunta: '¿Es seguro subir mis documentos aquí?',
      respuesta: 'Absolutamente. Utilizamos tecnología de encriptación de nivel bancario y tus archivos se guardan en una bóveda digital aislada. Solo el personal autorizado del estudio tiene acceso.',
      abierta: false
    },
    {
      pregunta: '¿Qué hago si me olvidé mi código?',
      respuesta: 'No te preocupes. Comunicate con nosotros vía WhatsApp o email indicando tu DNI y te ayudaremos a recuperar el acceso a tu gestión.',
      abierta: false
    }
  ];

  // Función para abrir/cerrar (tipo acordeón)
  toggleFaq(index: number) {
    // Si querés que se cierre la anterior al abrir una nueva:
     this.faqs.forEach((f, i) => {
       if (i !== index) f.abierta = false;
    });
    
    this.faqs[index].abierta = !this.faqs[index].abierta;
  }
}
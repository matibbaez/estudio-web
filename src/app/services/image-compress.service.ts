import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressService {

  constructor() { }

  async compressFile(file: File): Promise<File> {
    // Si no es imagen (ej: PDF), devolvemos el archivo original sin tocar
    if (!file.type.startsWith('image/')) {
      return file;
    }

    // Opciones de compresión optimizadas para documentos
    const options = {
      maxSizeMB: 0.8,          // Máximo 800KB aprox
      maxWidthOrHeight: 1920,  // Full HD
      useWebWorker: true,      // No traba la UI
      initialQuality: 0.7      // Buena calidad, poco peso
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      // La librería devuelve un Blob, lo convertimos a File para mantener el nombre original
      return new File([compressedFile], file.name, { type: compressedFile.type });
    } catch (error) {
      // Dejamos el error por si falla la librería, para poder debugear si un cliente se queja
      console.error('Error al comprimir imagen:', error);
      return file; // Ante la duda, devolvemos el original
    }
  }
}
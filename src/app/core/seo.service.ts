import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(private title: Title, private meta: Meta) { }

  generarTags(config: { title: string, description: string, image: string, url: string }) {
    // 1. Título de la pestaña del navegador
    this.title.setTitle(config.title);

    // 2. Meta descripción normal (Google)
    this.meta.updateTag({ name: 'description', content: config.description });

    // 3. Open Graph (WhatsApp, Facebook, LinkedIn)
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:image', content: config.image });
    this.meta.updateTag({ property: 'og:url', content: config.url });

    // 4. Twitter Cards (Por las dudas, siempre suma)
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: config.image });
  }
}
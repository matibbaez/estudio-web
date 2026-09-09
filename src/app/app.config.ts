import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http'; 
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { jwtInterceptor } from './auth/jwt-interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withNoIncrementalHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // AQUÍ EL CAMBIO:
    provideRouter(routes, withInMemoryScrolling({
        // 1. Ponemos 'disabled' para que Angular NO salte de golpe
        scrollPositionRestoration: 'disabled', 
        anchorScrolling: 'enabled',      
      }), withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    
    provideHttpClient(withXhr(), 
      withInterceptors([jwtInterceptor])
    ),
    provideAnimations(), provideClientHydration(withEventReplay(), withNoIncrementalHydration())
  ]
};
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { jwtInterceptor } from './auth/jwt-interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({
        scrollPositionRestoration: 'top', 
        anchorScrolling: 'enabled',      
      })
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideAnimations()
  ]
};

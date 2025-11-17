import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultarTramiteComponent } from './consultar-tramite';

describe('ConsultarTramite', () => {
  let component: ConsultarTramiteComponent;
  let fixture: ComponentFixture<ConsultarTramiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarTramiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultarTramiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

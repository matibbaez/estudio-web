import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultarTramite } from './consultar-tramite';

describe('ConsultarTramite', () => {
  let component: ConsultarTramite;
  let fixture: ComponentFixture<ConsultarTramite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarTramite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultarTramite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

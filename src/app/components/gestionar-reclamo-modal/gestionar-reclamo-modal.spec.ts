import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarReclamoModal } from './gestionar-reclamo-modal';

describe('GestionarReclamoModal', () => {
  let component: GestionarReclamoModal;
  let fixture: ComponentFixture<GestionarReclamoModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarReclamoModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarReclamoModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

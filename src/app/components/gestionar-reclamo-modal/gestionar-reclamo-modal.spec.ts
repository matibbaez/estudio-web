import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarReclamoModalComponent } from './gestionar-reclamo-modal';

describe('GestionarReclamoModal', () => {
  let component: GestionarReclamoModalComponent;
  let fixture: ComponentFixture<GestionarReclamoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarReclamoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarReclamoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IniciarReclamoComponent } from './iniciar-reclamo';

describe('IniciarReclamo', () => {
  let component: IniciarReclamoComponent;
  let fixture: ComponentFixture<IniciarReclamoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniciarReclamoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IniciarReclamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

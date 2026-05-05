import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Demandes } from './demandes';

describe('Demandes', () => {
  let component: Demandes;
  let fixture: ComponentFixture<Demandes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Demandes],
    }).compileComponents();

    fixture = TestBed.createComponent(Demandes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

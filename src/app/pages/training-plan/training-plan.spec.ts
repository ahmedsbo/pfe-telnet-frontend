import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingPlanComponent } from './training-plan';

describe('TrainingPlanComponent', () => {
  let component: TrainingPlanComponent;
  let fixture: ComponentFixture<TrainingPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingPlanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingPlanComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// import 'rxjs/add/observable/of';
// import 'rxjs/add/observable/throw';
// import { EffectsRunner, EffectsTestingModule } from '@ngrx/effects/testing';
// import { fakeAsync, TestBed, tick } from '@angular/core/testing';
// import { TestEffects } from './loading.effects';
// import { LoadingService } from '../services/loading.service';
// import { Observable } from 'rxjs/Observable';
//
// describe('TestEffects', () => {
//   let runner;
//   let testEffects;
//   let testService;
//
//   beforeEach(() => TestBed.configureTestingModule({
//     imports: [
//       EffectsTestingModule,
//     ],
//     providers: [
//       TestEffects,
//       {
//         provide: LoadingService,
//         useValue: jasmine.createSpyObj('testService', ['get']),
//       },
//     ],
//   }));
//
//   beforeEach(() => {
//     runner = TestBed.get(EffectsRunner);
//     testEffects = TestBed.get(TestEffects);
//     testService = TestBed.get(LoadingService);
//   });
//
//   describe('test$', () => {
//
//     it('should return a LOAD_SUCCESS action, on success', ()  => {
//       //
//     });
//
//     it('should return a LOAD_FAIL action, on error', () => {
//       //
//     });
//
//   });
//
// });

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let comp: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  beforeEach(() => {
    const authServiceStub = {};
    const storageServiceStub = {
      getImgHref: () => ({}),
    };
    TestBed.configureTestingModule({
      declarations: [AuthComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
      ],
    });
    fixture = TestBed.createComponent(AuthComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

});

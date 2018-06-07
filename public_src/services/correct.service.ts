import { Injectable } from '@angular/core';


import { BsModalService, BsModalRef } from 'ngx-bootstrap';

import { ModalComponent } from '../components/modal/modal.component';
import * as MobileDetect from 'mobile-detect';
@Injectable()
export class CorrectService {
  modalRef: BsModalRef;
  constructor(){

  }
}

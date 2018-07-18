import { EventEmitter, Injectable } from '@angular/core';

import { ConfService } from '../conf.service';
import { StorageService } from '../storage.service';
import { MapService } from '../map.service';

import * as L from 'leaflet';
import { RouteModalComponent } from '../../components/route-modal/route-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { ModalMapService } from './modal-map.service';

@Injectable()
export class AutoTasksService {
  public routes = [];
  modalRef: BsModalRef;

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private modalService: BsModalService,
              private modalMapSrv: ModalMapService,

  ) {
    this.modalService.onShown.subscribe(() => {
      this.modalMapSrv.onShownModal();
    });
  }
  public createAutomaticRoute(): any {
    this.modalRef = this.modalService.show(RouteModalComponent, {class: 'modal-lg'});
    console.log('stops in bounds and having route ref tag');
  }
}

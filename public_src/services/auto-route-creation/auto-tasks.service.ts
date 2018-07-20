import { Injectable } from '@angular/core';

import { StorageService } from '../storage.service';
import { MapService } from '../map.service';
import { ModalMapService } from './modal-map.service';
import { ProcessService } from '../process.service';

import { RouteModalComponent } from '../../components/route-modal/route-modal.component';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';


@Injectable()
export class AutoTasksService {
  public routes = [];
  modalRef: BsModalRef;

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private modalService: BsModalService,
              private modalMapSrv: ModalMapService,
              private processSrv: ProcessService,
  ) {
    this.modalService.onShown.subscribe(() => {
      this.modalMapSrv.onShownModal();
    });
    this.modalService.onHidden.subscribe(() => {
      this.processAllDownloadedOnMainMap();
      this.storageSrv.currentElement = null;
      this.storageSrv.currentElementsChange.emit(
        JSON.parse(JSON.stringify(null)),
      );
      this.storageSrv.stopsForRoute     = [];
      this.storageSrv.platformsForRoute = [];
      this.mapSrv.highlightType         = 'Stops';
    });
  }
  public createAutomaticRoute(): any {
    this.modalRef = this.modalService.show(RouteModalComponent, {class: 'modal-lg', ignoreBackdropClick: true});
  }

  public processAllDownloadedOnMainMap(): any{
    for (let res of this.processSrv.savedContinousQueryResponses){
      this.processSrv.processResponse(res);
    }
  }
}

import { EventEmitter, Injectable } from '@angular/core';

import { ConfService } from '../conf.service';
import { StorageService } from '../storage.service';
import { MapService } from '../map.service';

import * as L from 'leaflet';
import { RouteModalComponent } from '../../components/route-modal/route-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { ModalMapService } from './modal-map.service';
import {ProcessService} from '../process.service';

@Injectable()
export class AutoTasksService {
  public routes = [];
  modalRef: BsModalRef;
  // public firstShow;

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
      this.storageSrv.stopsForRoute = [];
      this.storageSrv.platformsForRoute = [];
      this.mapSrv.highlightType = 'Stops';
    });


  }
  public createAutomaticRoute(): any {
    // if(this.firstShow === undefined){
    //   this.firstShow = true;
    // } else {
    //   this.firstShow = false;
    // }

    // let initialState = { firstShow: this.firstShow };
    this.modalRef = this.modalService.show(RouteModalComponent, {class: 'modal-lg', ignoreBackdropClick: true});
    console.log('stops in bounds and having route ref tag');
  }

  public processAllDownloadedOnMainMap(): any{
    for (let res of this.processSrv.savedContinousQueryResponses){
      //renders as well as processes
      this.processSrv.processResponse(res);
    }
  }
}

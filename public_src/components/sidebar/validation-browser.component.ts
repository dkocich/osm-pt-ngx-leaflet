import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
// import { Modal2Component } from '../modal2/modal2.component';
import { MapService } from '../../services/map.service';
// import * as L from 'leaflet';
import { ErrorHighlightService } from '../../services/error-highlight.service';
import { Observable } from 'rxjs';
import {  select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';
// import { IAppState } from '../../store/model';
// import { ProcessService } from '../../services/process.service';
// import { Modal2Component } from '../modal2/modal2.component';
// import 'leaflet-area-select';
// import '../node_modules/leaflet-editable/src/Leaflet.Editable.js';
// import 'leaflet-editable';
//
//
@Component({
  selector: 'validation-browser',
  templateUrl: './validation-browser.component.html',
  styleUrls: ['./validation-browser.component.less'],
})
export class ValidationBrowserComponent implements OnInit {
  modalRef2: BsModalRef;
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<string>;
  // nameErrors: number = 0;
  // refErrors: number = 0;
  public errorList: object[] = [];
  constructor(private modalService: BsModalService, private mapSrv: MapService, private errorHighlightSrv: ErrorHighlightService,
              public appActions: AppActions) { }

  ngOnInit(): any { }
  startValidation(template: TemplateRef<any>): any {
    // let polyline: any = L.polyline([[43.1, 1.2], [43.2, 1.3], [43.3, 1.2]]).addTo(L.map('map2', { editable: true }));
    // polyline.enableEdit();
    if (this.mapSrv.map.getZoom() > 11) {
      // this.errorHighlightSrv.missingTagError();
      // this.mapSrv.clearHighlight();
      // document.getElementById('map').style.width = '100%';
      // this.mapSrv.map.invalidateSize();
      // this.appActions.actSetErrorCorrectionMode('missing tag');
      // this.isErrorMode = true;
      // this.isErrorMode =  false;

    this.errorHighlightSrv.countErrors();
    console.log(this.errorHighlightSrv.errorList);
    this.errorList = this.errorHighlightSrv.errorList;
      // this.refErrors = this.errorHighlightSrv.refErrors;
      // this.nameErrors = this.errorHighlightSrv.nameErrors;
    } else {
      this.modalRef2 = this.modalService.show(template);
    }
  }
  startCorrection(): any {

  }
}

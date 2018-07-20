import { Injectable } from '@angular/core';
import { MapService } from '../map.service';
import { StorageService } from '../storage.service';


@Injectable()
export class ModalMapService {
  public map;
  public routes = [];
  public osmtogeojson: any = require('osmtogeojson');

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService) {
  }

  public onShownModal(): any {
    console.log('in validaet size');
    this.map.invalidateSize();
  }

  public renderAlreadyDownloadedData(): any {
    let obj: any = {};
    let elements = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    console.log('obj', obj);
    let transformed = this.osmtogeojson(obj);
    this.mapSrv.renderTransformedGeojsonData2(transformed, this.map);
  }

}

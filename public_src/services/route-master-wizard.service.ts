import { EventEmitter, Injectable } from '@angular/core';

import { MapService } from './map.service';
import { StorageService } from './storage.service';
import { BsModalService } from 'ngx-bootstrap';
import { ProcessService } from './process.service';

import * as L from 'leaflet';

@Injectable()
export class RouteMasterWizardService {
  public map;
  public routes              = [];
  public ptLayerModal;
  public osmtogeojson: any   = require('osmtogeojson');
  public modalMapElementsMap = new Map();

  public autoRouteMapNodeClick: EventEmitter<number>     = new EventEmitter();
  public routesReceived: EventEmitter<any>               = new EventEmitter();
  public refreshAvailableConnectivity: EventEmitter<any> = new EventEmitter();

  public savedMultipleNodeDataResponses = [];
  public savedContinuousQueryResponses  = [];

  public elementsRenderedModalMap = new Set();
  public nodesFullyDownloaded     = new Set();

  public routesMap: Map<string, any[]> = new Map();
  public membersHighlightLayerGroup    = L.layerGroup();

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private modalService: BsModalService,
              private processSrv: ProcessService) {
    this.modalService.onShown.subscribe(() => {
      this.onShownModal();
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

  /***
   * Fired when modal has rendered
   * @returns {void}
   */
  public onShownModal(): void {
    this.map.invalidateSize();
  }

  /***
   * Renders data on modal map which was already present on the main map
   * @returns {void}
   */
  public renderAlreadyDownloadedData(): void {
    let obj: any = {};
    let elements = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements    = elements;
    let transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataRouteMasterWizard(transformed, this.map);
  }

  /***
   *Used when modal is closed,
   *  all data downloaded for modal map is processed for main application
   * @returns {void}
   */
  public processAllDownloadedOnMainMap(): void {
    for (let res of this.savedContinuousQueryResponses) {
      this.processSrv.processResponse(res);
    }
  }

  /***
   * Renders data on modal map
   * @param transformedGeoJSON
   * @param {Map} map
   */
  public renderTransformedGeojsonDataRouteMasterWizard(transformedGeoJSON: any, map: L.Map): void {
    this.ptLayerModal = L.geoJSON(transformedGeoJSON, {
      filter       : (feature) => {
        if (!this.elementsRenderedModalMap.has(feature.id) &&
          'public_transport' in feature.properties && feature.id[0] === 'n'
        ) {
          return true;
        } else {
          return false;
        }
      },
      onEachFeature: (feature, layer) => {
        this.elementsRenderedModalMap.add(feature.id);
        this.enableClickForRouteMasterWizardMap(feature, layer);
      },
      pointToLayer : (feature, latlng) => {
        return this.mapSrv.stylePoint(feature, latlng);
      },
    });

    console.log('LOG (route master wizard s.) Adding PTlayer to modal map again', this.ptLayerModal);
    this.ptLayerModal.addTo(map);
  }
  /***
   * Enables click of nodes for modal map
   * @param feature
   * @param layer
   * @returns {void}
   */
  public enableClickForRouteMasterWizardMap(feature: any, layer: any): void {
    layer.on('click', () => {
      this.handleRouteMasterWizardMarkerClick(feature);
    });
  }

  /***
   * Handles map click
   * @param feature
   * @returns {void}
   */
  private handleRouteMasterWizardMarkerClick(feature: any): void {
    const featureId: number = this.mapSrv.getFeatureIdFromMarker(feature);
    this.autoRouteMapNodeClick.emit(featureId);
  }

}

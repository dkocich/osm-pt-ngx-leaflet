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

  /***
   * Renders data on modal map
   * @param transformedGeoJSON
   * @param {Map} map
   */
  public renderTransformedGeojsonData(transformedGeoJSON: any, map: L.Map): void {
    this.ptLayerModal = L.geoJSON(transformedGeoJSON, {
      filter: (feature) => {
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
      pointToLayer: (feature, latlng) => {
        return this.mapSrv.stylePoint(feature, latlng);
      },
    });

    console.log('LOG (map s.) Adding PTlayer to modal map again', this.ptLayerModal);
    this.ptLayerModal.addTo(map);
  }

  private handleRouteWizardMarkerClick(feature: any): void {
    const featureId: number = this.mapSrv.getFeatureIdFromMarker(feature);
    this.autoRouteMapNodeClick.emit(featureId);
  }

  /***
   * Returns all stops/platforms on the given map
   * @param {Map} map
   * @returns {any[]}
   */
  public findStopsInBounds(map: L.Map): any[] {
    let stopsInBounds = [];
    this.modalMapElementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        if (map.getBounds().contains({ lat: stop.lat, lng: stop.lon })) {
          stopsInBounds.push(stop.id);
        }
      }
    });
    return stopsInBounds;
  }

  public findCountToBeComparedRels(response: any): any {
    let newDownloadedRoutes = [];
    let oldDownloadedRoutes = [];
    if (response) {
      for (let element of response['elements']) {
        if ((element.type === 'relation')
          && !(element.tags.public_transport === 'stop_area'
            &&  element.tags.public_transport === 'ref')
          && (element.members)) {
          oldDownloadedRoutes.push(element);
        }
      }
    } else {
      this.modalMapElementsMap.forEach((element) => {
        if ((element.type === 'relation')
          && !(element.tags.public_transport === 'stop_area'
            &&  element.tags.public_transport === 'ref')
          && (element.members)
        && this.checkMembersInBounds(element)) {
          newDownloadedRoutes.push(element);
        }
      });

      let rels = newDownloadedRoutes.concat(oldDownloadedRoutes);
      let relsMap =  new Map();
      rels.forEach((rel) => {
        let noOfMembers = rel['members'].length;
        let inBounds = 0;
        for (let member of rel['members']) {
          let latlng = { lat: member.lat, lng: member.lon };
          if (this.map.getBounds().contains(latlng)) {
              inBounds++;
          }
        }
        let percentCoverage = (inBounds / noOfMembers) * 100;
        relsMap.set(rel.id,  percentCoverage);
      });

      return relsMap;
    }
  }

  public checkMembersInBounds(relation: any): boolean {
    let flag = false;
    relation['members'].forEach((member) => {
      let latlng = { lat: member.lat, lng: member.lon };
      if (this.map.getBounds().contains(latlng)) {
        flag = true;
      }
    });
    return flag;
  }

  public findMissingRouteMasters(res: any): any {
    for (let element of res['elements']) {
      if (!this.storageSrv.elementsMap.has(element.id)) {
        console.log('LOG (processing s.) New element added:', element);
        this.storageSrv.elementsMap.set(element.id, element);
        this.storageSrv.elementsDownloaded.add(element.id);
      }
    }
    let missingRMsMap = new Map();
    for (let rel of relations) {
      for (let rm of routeMasters) {
        if (rel.id === rm.ref) {

        }
      }
    }

  }
}

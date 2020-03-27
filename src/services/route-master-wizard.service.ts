import { EventEmitter, Injectable } from '@angular/core';

import { MapService } from './map.service';
import { StorageService } from './storage.service';
import { BsModalService } from 'ngx-bootstrap';
import { ProcessService } from './process.service';

import * as L from 'leaflet';

import { IPtRelation } from '../core/ptRelation.interface';
import { IOverpassResponse } from '../core/overpassResponse.interface';
import { IOsmElement } from '../core/osmElement.interface';

@Injectable()
export class RouteMasterWizardService {
  public map;
  public routes = [];
  public ptLayerModal;
  public osmtogeojson: any = require('osmtogeojson');
  public modalMapElementsMap = new Map();

  public newRoutesMapReceived: EventEmitter<Map<string, Array<{ id: number, percentCoverage: number }>>> = new EventEmitter();

  public savedMultipleNodeDataResponses = [];
  public savedContinuousQueryResponses = [];
  public savedMasterQueryResponses = [];

  public elementsRenderedModalMap = new Set();
  public nodesFullyDownloaded = new Set();

  public relsMap = new Map();
  public newRMsMap: Map<string, Array<{ id: number, percentCoverage: number }>> = new Map();

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
      this.storageSrv.currentElementsChange.emit(null);
      this.storageSrv.stopsForRoute = [];
      this.storageSrv.platformsForRoute = [];
      this.mapSrv.highlightType = 'Stops';
    });
  }

  /**
   * Fired when modal has rendered
   * @returns {void}
   */
  public onShownModal(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Renders data on modal map which was already present on the main map
   * @returns {void}
   */
  public renderAlreadyDownloadedData(): void {
    const obj: { elements: IOsmElement[] } = { elements: null };
    const elements: IOsmElement[] = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    let transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataRMWizard(transformed, this.map);
  }

  /**
   * Used when modal is closed,
   *  all data downloaded for modal map is processed for main application
   * @returns {void}
   */
  public processAllDownloadedOnMainMap(): void {
    for (let res of this.savedContinuousQueryResponses) {
      this.processSrv.processResponse(res);
    }
    for (let res of this.savedMultipleNodeDataResponses) {
      this.processSrv.processNodeResponse(res);
    }
    for (let res of this.savedMasterQueryResponses) {
      this.processSrv.processMastersResponse(res);
    }
  }

  /**
   * Renders data on modal map
   * @param transformedGeoJSON
   * @param {Map} map
   */
  public renderTransformedGeojsonDataRMWizard(transformedGeoJSON: any, map: L.Map): void {
    this.ptLayerModal = L.geoJSON(transformedGeoJSON, {
      filter: (feature) => {
        return (!this.elementsRenderedModalMap.has(feature.id) &&
          'public_transport' in feature.properties && feature.id[0] === 'n'
        );
      },
      onEachFeature: (feature) => {
        this.elementsRenderedModalMap.add(feature.id);
      },
      pointToLayer: (feature, latlng) => {
        return this.mapSrv.stylePoint(feature, latlng);
      },
    });
    console.log('LOG (route master wizard s.) Adding PT layer to modal map again', this.ptLayerModal);
    this.ptLayerModal.addTo(map);
  }

  public findToBeComparedRels(response: IOverpassResponse): Map<number, number> {
    let newDownloadedRoutes = [];
    let oldDownloadedRoutes = [];
    if (response) {
      for (let element of response.elements) {
        if ((element.type === 'relation')
          && !((element.tags.public_transport === 'stop_area'))
          && (element['members'])) {
          newDownloadedRoutes.push(element);
        }
      }
    }
    this.modalMapElementsMap.forEach((element: IOsmElement) => {
      if ((element.type === 'relation')
        && !(element.tags.public_transport === 'stop_area')
        && element.tags.ref
        && (element['members'])
        && this.checkMembersInBounds(element)) {
        oldDownloadedRoutes.push(element);
      }
    });
    console.log('LOG (route master wizard s.) Newly downloaded relations',
      newDownloadedRoutes, 'old already present relations', oldDownloadedRoutes);

    let rels = [...newDownloadedRoutes, ...oldDownloadedRoutes];
    let relsMap = new Map();
    let refOfRels = [];
    rels.forEach((rel: IPtRelation) => {
      let noOfMembers = rel.members.length;
      let fullyDownloaded = 0;
      for (let member of rel.members) {
        let memberEle = this.modalMapElementsMap.get(member.ref);
        if (this.modalMapElementsMap.has(member.ref) && memberEle.type === 'node') {
          let element = this.modalMapElementsMap.get(member.ref);
          refOfRels.push(rel.tags.ref);
          if (this.nodesFullyDownloaded.has(element.id)) {
            fullyDownloaded++;
          }
        }
      }
      let percentCoverage = (fullyDownloaded / noOfMembers) * 100;
      relsMap.set(rel.id, percentCoverage);
    });
    console.log('LOG (route master wizard s.) refs of routes relations to be compared:', refOfRels);
    this.relsMap = relsMap;
    return relsMap;
  }

  public checkMembersInBounds(relation: IOsmElement): boolean {
    let flag = false;
    relation['members'].forEach((member) => {
      if (this.modalMapElementsMap.has(member.ref) && this.modalMapElementsMap.get(member.ref).type === 'node') {
        let element = this.modalMapElementsMap.get(member.ref);
        let latlng = { lat: element.lat, lng: element.lon };
        if (this.map.getBounds().contains(latlng)) {
          flag = true;
        }
      }
    });
    return flag;
  }

  public findMissingRouteMasters(res: IOverpassResponse): void {
    this.newRMsMap = new Map();
    let RMRefs: string[] = [];

    for (let element of res['elements']) {
      if (!this.modalMapElementsMap.has(element.id)) {
        this.modalMapElementsMap.set(element.id, element);
      }
    }
    this.modalMapElementsMap.forEach((element) => {
      if (element.tags.type === 'route_master' && element.tags.ref) {
        RMRefs.push(element.tags.ref);
      }
    });

    console.log('LOG (route master wizard s.) Refs of route masters to be compared:', RMRefs);

    this.relsMap.forEach((value, key) => {
      let rel = this.modalMapElementsMap.get(key);
      if (!RMRefs.includes(rel.tags.ref)) {
        if (this.newRMsMap.has(rel.tags.ref)) {
          let alreadyAddedRels = this.newRMsMap.get(rel.tags.ref);
          alreadyAddedRels.push({ id: rel.id, percentCoverage: value });
        } else {
          let rels = [];
          rels.push({ id: rel.id, percentCoverage: value });
          this.newRMsMap.set(rel.tags.ref, rels);
        }
      }
    });

    let filteredMap = new Map();
    this.newRMsMap.forEach((value, key) => {
      if (value.length >= 2) {
        filteredMap.set(key, value);
      }
    });
    this.newRMsMap = filteredMap;
    console.log('LOG (route master wizard s.) Route masters for suggestions after ' +
      'filtering RM\'s withsingle route suggestions', this.newRMsMap);
    if (this.newRMsMap.size !== 0) {
      this.newRoutesMapReceived.emit(this.newRMsMap);
    } else {
      alert('Sorry, no suggestions found for the selected area.');
    }

    console.log('LOG (route master wizard s.) Route masters map for suggestions RM\'s', this.newRMsMap);
  }

  /**
   * Highlight selected member route of currently selected route master on map
   * @param routeID
   * @returns {void}
   */
  public viewRoute(routeID: number): void {
    let route = this.modalMapElementsMap.get(routeID);
    this.mapSrv.clearHighlight(this.map);
    this.storageSrv.stopsForRoute = [];
    this.storageSrv.platformsForRoute = [];
    this.mapSrv.showRoute(route, this.map, this.modalMapElementsMap);
  }

}

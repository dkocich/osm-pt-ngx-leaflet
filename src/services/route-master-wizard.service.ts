import {EventEmitter, Injectable} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap';
import {MapService} from './map.service';
import {StorageService} from './storage.service';
import {ProcessService} from './process.service';
import * as L from 'leaflet';
import {IPtRelation} from '../core/ptRelation.interface';
import {IOverpassResponse} from '../core/overpassResponse.interface';
import {IOsmElement} from '../core/osmElement.interface';

@Injectable()
export class RouteMasterWizardService {
  map;
  routes = [];
  ptLayerModal;
  osmtogeojson: any = require('osmtogeojson');
  modalMapElementsMap = new Map();

  newRoutesMapReceived: EventEmitter<Map<string, Array<{ id: number, percentCoverage: number }>>> = new EventEmitter();

  savedMultipleNodeDataResponses = [];
  savedContinuousQueryResponses = [];
  savedMasterQueryResponses = [];

  elementsRenderedModalMap = new Set();
  nodesFullyDownloaded = new Set();

  relsMap = new Map();
  newRMsMap: Map<string, Array<{ id: number, percentCoverage: number }>> = new Map();

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
   */
  onShownModal(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Renders data on modal map which was already present on the main map
   */
  renderAlreadyDownloadedData(): void {
    const obj: { elements: IOsmElement[] } = { elements: null };
    const elements: IOsmElement[] = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    const transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataRMWizard(transformed, this.map);
  }

  /**
   * Used when modal is closed,
   *  all data downloaded for modal map is processed for main application
   */
  processAllDownloadedOnMainMap(): void {
    for (const res of this.savedContinuousQueryResponses) {
      this.processSrv.processResponse(res);
    }
    for (const res of this.savedMultipleNodeDataResponses) {
      this.processSrv.processNodeResponse(res);
    }
    for (const res of this.savedMasterQueryResponses) {
      this.processSrv.processMastersResponse(res);
    }
  }

  /**
   * Renders data on modal map
   */
  renderTransformedGeojsonDataRMWizard(transformedGeoJSON: any, map: L.Map): void {
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

  findToBeComparedRels(response: IOverpassResponse): Map<number, number> {
    const newDownloadedRoutes = [];
    const oldDownloadedRoutes = [];
    if (response) {
      for (const element of response.elements) {
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

    const rels = [...newDownloadedRoutes, ...oldDownloadedRoutes];
    const relsMap = new Map();
    const refOfRels = [];
    rels.forEach((rel: IPtRelation) => {
      const noOfMembers = rel.members.length;
      let fullyDownloaded = 0;
      for (const member of rel.members) {
        const memberEle = this.modalMapElementsMap.get(member.ref);
        if (this.modalMapElementsMap.has(member.ref) && memberEle.type === 'node') {
          const element = this.modalMapElementsMap.get(member.ref);
          refOfRels.push(rel.tags.ref);
          if (this.nodesFullyDownloaded.has(element.id)) {
            fullyDownloaded++;
          }
        }
      }
      const percentCoverage = (fullyDownloaded / noOfMembers) * 100;
      relsMap.set(rel.id, percentCoverage);
    });
    console.log('LOG (route master wizard s.) refs of routes relations to be compared:', refOfRels);
    this.relsMap = relsMap;
    return relsMap;
  }

  checkMembersInBounds(relation: IOsmElement): boolean {
    let flag = false;
    relation['members'].forEach((member) => {
      if (this.modalMapElementsMap.has(member.ref) && this.modalMapElementsMap.get(member.ref).type === 'node') {
        const element = this.modalMapElementsMap.get(member.ref);
        const latlng = { lat: element.lat, lng: element.lon };
        if (this.map.getBounds().contains(latlng)) {
          flag = true;
        }
      }
    });
    return flag;
  }

  findMissingRouteMasters(res: IOverpassResponse): void {
    this.newRMsMap = new Map();
    const RMRefs: string[] = [];

    for (const element of res['elements']) {
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
      const rel = this.modalMapElementsMap.get(key);
      if (!RMRefs.includes(rel.tags.ref)) {
        if (this.newRMsMap.has(rel.tags.ref)) {
          const alreadyAddedRels = this.newRMsMap.get(rel.tags.ref);
          alreadyAddedRels.push({ id: rel.id, percentCoverage: value });
        } else {
          const rels = [];
          rels.push({ id: rel.id, percentCoverage: value });
          this.newRMsMap.set(rel.tags.ref, rels);
        }
      }
    });

    const filteredMap = new Map();
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
   */
  viewRoute(routeID: number): void {
    const route = this.modalMapElementsMap.get(routeID);
    this.mapSrv.clearHighlight(this.map);
    this.storageSrv.stopsForRoute = [];
    this.storageSrv.platformsForRoute = [];
    this.mapSrv.showRoute(route, this.map, this.modalMapElementsMap);
  }

}

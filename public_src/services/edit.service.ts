import { EventEmitter, Injectable } from '@angular/core';

import * as L from 'leaflet';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { IPtStop } from '../core/ptStop.interface';
import { IPtRelation } from '../core/ptRelation.interface';
import { IPtRelationNew } from '../core/ptRelationNew.interface';
import { RouteModalComponent } from '../components/route-modal/route-modal.component';

import { AutoTasksService } from './auto-tasks.service';

@Injectable()
export class EditService {
  public editingMode: EventEmitter<boolean>      = new EventEmitter(false);
  public currentEditStep: number;
  public totalEditSteps: number;
  public currentTotalSteps: EventEmitter<object> = new EventEmitter();
  public elementChanges: any                     = [];
  private editing: boolean;
  modalRef: BsModalRef;

  constructor(
    private mapSrv: MapService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private modalService: BsModalService,
    private autoTaskSrv: AutoTasksService,
  ) {

    this.modalService.onShown.subscribe(() => {
      this.autoTaskSrv.onShownModal();
    });
    //
    // this.modalService.onShow.subscribe(() => {
    //   this.autoTaskSrv.onShowModal();
    // });


    // local events
    this.currentTotalSteps.subscribe(
      /**
       * @param data - f. e. {"current": 5, "total": 10}
       */
      (data) => {
        this.currentEditStep = data.current;
        this.totalEditSteps  = data.total;
      },
    );

    // MapService events
    this.mapSrv.markerEdit.subscribe(
      /**
       * @param data - {"featureId": , "type": "change marker position",
       * "change": {"from": {"lat": ..., "lng": ... }, "to": {"lat": ..., "lng": ... } } }
       */
      (data) => {
        const element = this.processSrv.getElementById(
          Number(data.featureId),
        );
        this.addChange(element, data.type, data.change);
      },
    );

    this.editingMode.subscribe(
      /**
       * @param data
       */
      (data) => {
        console.log(
          'LOG (editing s.) Editing mode change in editSrv- ',
          data,
        );
        this.editing = data;
        this.storageSrv.markersMap.forEach((marker) => {
          if (this.editing === false) {
            marker.dragging.disable();
          } else if (this.editing === true) {
            marker.dragging.enable();
          }
        });
      },
    );

    this.mapSrv.markerMembershipToggleClick.subscribe(
      /**
       * @param data - contains { featureId: number } of clicked map marker
       */
      (data) => {
        this.handleMarkerMembershipToggleClick(data.featureId);
      },
    );
  }

  /**
   * Handles reapplying of unsaved edits after the page was reloaded.
   */
  public continueEditing(): void {
    this.storageSrv.edits = JSON.parse(localStorage.getItem('edits'));
    this.updateCounter();
    // TODO add logic to apply all already created changes
    if (this.storageSrv.localJsonStorage) {
      alert('TODO: Data are loaded - edits should be applied right now.');
    } else {
      alert(
        'TODO: There are no loaded data - can\'t apply saved edits to map now.',
      );
    }
  }

  /**
   * Handles the complete process of adding a change to the history.
   * @param element - changed entity
   * @param type - some comment about a created change
   * @param change - change object
   */
  public addChange(element: any, type: string, change: object): any {
    const edits: object[] = this.storageSrv.edits;
    const editObj: any    = {
      change,
      id: element.id,
      type,
    };
    if (this.isBrowsingHistoryOfChanges()) {
      this.deleteMoreRecentChanges(this.currentEditStep);
    }

    if (type === 'change members') {
      if (this.changeIsEqual(editObj)) {
        return alert(
          'FIXME: Problem has occured - change is same like previous edit in the editing history.',
        );
      }
      this.simplifyMembers(editObj);
    }

    if (
      ['change tag', 'change members', 'toggle members'].indexOf(type) > -1 &&
      this.storageSrv.edits.length &&
      this.shouldCombineChanges(editObj)
    ) {
      this.combineChanges(editObj);
    } else {
      this.storageSrv.edits.push(editObj);
    }

    switch (editObj.type) {
      case 'add tag':
        console.log('LOG (editing s.) Should add this tag: ', editObj);
        const atElem                    = this.storageSrv.elementsMap.get(editObj.id);
        atElem.tags[editObj.change.key] = editObj.change.value;
        this.storageSrv.elementsMap.set(editObj.id, atElem);
        console.log('LOG (editing s.) Added element: ', atElem);
        break;
      case 'remove tag':
        console.log('LOG (editing s.) Should remove this tag: ', editObj);
        const rtElem = this.storageSrv.elementsMap.get(editObj.id);
        delete rtElem.tags[editObj.change.key];
        this.storageSrv.elementsMap.set(editObj.id, rtElem);
        console.log('LOG (editing s.) Removed element: ', rtElem);
        break;
      case 'change tag':
        console.log('LOG (editing s.) I should make this change: ', editObj);
        const chtElem = this.storageSrv.elementsMap.get(editObj.id);
        delete chtElem.tags[editObj.change.from.key];
        chtElem.tags[editObj.change.to.key] = editObj.change.to.value;
        this.storageSrv.elementsMap.set(editObj.id, chtElem);
        break;
      case 'change members':
        console.log('LOG (editing s.) I should change members', editObj);
        const chmElem   = this.storageSrv.elementsMap.get(editObj.id);
        chmElem.members = editObj.change.to;
        this.storageSrv.elementsMap.set(editObj.id, chmElem);
        break;
      case 'add element':
        console.log('LOG (editing s.) I should add element', editObj);
        if (!this.storageSrv.elementsMap.get(editObj.id)) {
          this.storageSrv.elementsMap.set(editObj.id, editObj.change.to);
        } else {
          alert(
            'FIXME: this new NODE\'s ID already exists ' +
            JSON.stringify(this.storageSrv.elementsMap.get(editObj.id)),
          );
        }
        this.processSrv.refreshTagView(
          this.storageSrv.elementsMap.get(editObj.id),
        );
        break;
      case 'modify element':
        console.log('LOG (editing s.) I should modify element', editObj);
        const modObj = this.storageSrv.elementsMap.get(editObj.id);
        modObj.lat   = editObj.change.to.lat;
        modObj.lon   = editObj.change.to.lon;
        this.storageSrv.elementsMap.set(editObj.id, modObj);
        break;
      case 'add route':
        console.log('LOG (editing s.) I should add route', editObj);
        if (!this.storageSrv.elementsMap.get(editObj.id)) {
          this.storageSrv.elementsMap.set(editObj.id, editObj.change.to);
          this.storageSrv.listOfRelations.push(editObj.change.to); // un-shift
        } else {
          alert(
            'FIXME: this new ROUTE\'s ID already exists ' +
            JSON.stringify(this.storageSrv.elementsMap.get(editObj.id)),
          );
        }
        this.processSrv.refreshTagView(
          this.storageSrv.elementsMap.get(editObj.id),
        );
        break;
      case 'toggle members':
        console.log(
          'LOG (editing s.) Should change members for this created route',
          editObj,
        );
        this.storageSrv.elementsMap.set(element.id, element); // save modified relation
        break;
      case 'create master':
        console.log('LOG (editing s.) I should add route_master', editObj);
        if (!this.storageSrv.elementsMap.get(editObj.id)) {
          this.storageSrv.elementsMap.set(editObj.id, editObj.change.to);
          this.storageSrv.listOfMasters.push(editObj.change.to); // un-shift
        } else {
          alert(
            'FIXME: this new ROUTE\'s ID already exists ' +
            JSON.stringify(this.storageSrv.elementsMap.get(editObj.id)),
          );
        }
        let masterRel = this.storageSrv.elementsMap.get(editObj.id);
        this.processSrv.refreshTagView(masterRel);
        this.processSrv.refreshRelationView(masterRel);
        break;
      default:
        alert(
          'Current change type was not recognized ' + JSON.stringify(editObj),
        );
    }
    if (['add tag', 'remove tag', 'change tag'].indexOf(type) > -1) {
      this.processSrv.refreshTagView(element);
    } else if (['change members'].indexOf(type) > -1) {
      if (element.tags.type === 'route') {
        // to prevent zoom error for route_masters
        this.processSrv.filterStopsByRelation(
          this.storageSrv.elementsMap.get(editObj.id),
        );
        this.processSrv.exploreRelation(
          this.storageSrv.elementsMap.get(editObj.id),
          false,
          false,
          false,
        );
      }
    } else if (['toggle members'].indexOf(type) > -1) {
      this.processSrv.filterStopsByRelation(
        this.storageSrv.elementsMap.get(editObj.id),
      );
    }
    if (['add element', 'add route'].indexOf(type) > -1) {
      if (type === 'add element') {
        this.processSrv.exploreStop(element, false, false, false);
      }
      this.storageSrv.logStats();
    }
    this.storageSrv.syncEdits();
    this.updateCounter();
  }

  /**
   * Handles adding of different PT elements and fills attributes automatically.
   * @param {string} creatingElementOfType
   * @param {any} event
   */
  public createElement(creatingElementOfType: string, event: any): void {
    let newId: number = this.findNewId();
    const marker      = this.initializeNewMarker(
      creatingElementOfType,
      event,
      newId,
    );
    this.createNewMarkerEvents(marker);
    this.storageSrv.markersMap.set(newId, marker);
    marker.addTo(this.mapSrv.map);
    const latlng            = marker.getLatLng();
    let newElement: IPtStop = {
      changeset: -999,
      id       : newId,
      lat      : latlng.lat,
      lon      : latlng.lng,
      tags     : {},
      timestamp: new Date().toISOString().split('.')[0] + 'Z',
      type     : 'node',
      uid      : Number(localStorage.getItem('id')),
      user     : localStorage.getItem('display_name'),
      version  : 1,
    };
    switch (creatingElementOfType) {
      case 'stop':
        newElement.tags = {
          name            : '',
          public_transport: 'stop_position',
        };
        break;
      case 'platform':
        newElement.tags = {
          name            : '',
          public_transport: 'platform',
        };
        break;
      default:
        console.log(
          'LOG (editing s.) Type was created: ',
          creatingElementOfType,
        );
    }
    let change = {from: undefined, to: newElement};
    this.addChange(newElement, 'add element', change);
  }

  /**
   * Creates completely new route with basic object structure.
   */
  public createRoute(): void {
    const newId                    = this.findNewId();
    const newRoute: IPtRelationNew = {
      id       : newId,
      timestamp: new Date().toISOString().split('.')[0] + 'Z',
      version  : 1,
      changeset: -999,
      uid      : Number(localStorage.getItem('id')),
      user     : localStorage.getItem('display_name'),
      type     : 'relation',
      members  : [],
      tags     : {
        type                      : 'route',
        route                     : 'bus',
        ref                       : '',
        network                   : '',
        operator                  : '',
        name                      : '',
        from                      : '',
        to                        : '',
        wheelchair                : '',
        colour                    : '',
        'public_transport:version': '2',
      },
    };
    let change                     = {from: undefined, to: newRoute};
    this.addChange(newRoute, 'add route', change);
  }

  /**
   * Creates new route_master with or without first route.
   * @param {number} relId
   */
  createMaster(relId?: number): void {
    const newId        = this.findNewId();
    const newMasterRel = {
      id       : newId,
      timestamp: new Date().toISOString().split('.')[0] + 'Z',
      version  : 1,
      changeset: -999,
      uid      : Number(localStorage.getItem('id')),
      user     : localStorage.getItem('display_name'),
      type     : 'relation',
      members  : [],
      tags     : {
        type                      : 'route_master',
        route_master              : 'bus',
        ref                       : '',
        network                   : '',
        operator                  : '',
        name                      : '',
        wheelchair                : '',
        colour                    : '',
        'public_transport:version': '2',
      },
    };
    if (relId) {
      newMasterRel.members.push({
        type: 'relation',
        ref : relId,
        role: '',
      });
      this.storageSrv.idsHaveMaster.add(relId);
      this.storageSrv.queriedMasters.add(relId); // FIXME ? Is it rel or master
    }
    let change = {from: undefined, to: newMasterRel};
    this.addChange(newMasterRel, 'create master', change);
  }

  /**
   * Adds/removes members from route_master relation.
   * @param {number} relId
   * @param {number} routeMasterId
   */
  public changeRouteMasterMembers(relId: number, routeMasterId: number): void {
    console.log(
      'LOOOOOOG test ', typeof relId, relId,
      typeof routeMasterId, routeMasterId,
    );
    let routeMaster = this.storageSrv.elementsMap.get(routeMasterId);
    let change: any = {from: JSON.parse(JSON.stringify(routeMaster.members))};
    let newMember   = {
      type: 'relation',
      ref : relId,
      role: '',
    };
    const newOrder  = routeMaster.members;
    newOrder.push(newMember);
    change.to = JSON.parse(JSON.stringify(newOrder));
    this.storageSrv.idsHaveMaster.add(relId);
    this.storageSrv.queriedMasters.add(relId);
    this.addChange(routeMaster, 'change members', change);
  }

  /**
   * Handles process of node's membership toggle.
   * @param featureId
   */
  private handleMarkerMembershipToggleClick(featureId: number): void {
    this.redrawMembersHighlight(featureId);
  }

  /**
   * @param featureId
   */
  public redrawMembersHighlight(featureId?: number): void {
    const rel = JSON.parse(
      JSON.stringify(
        this.storageSrv.elementsMap.get(
          this.storageSrv.currentElement.id,
        ),
      ),
    ); // string to not influence new route edit
    if (!rel || rel.type !== 'relation') {
      return alert(
        'Relation was not found ' +
        JSON.stringify(this.storageSrv.currentElement),
      );
    }
    if (!featureId && rel.members.length === 0) {
      return console.log('LOG: no members and nothing to highlight - ending'); // FIXME console.log
    } else {
      this.mapSrv.clearCircleHighlight();
      const feature = this.storageSrv.elementsMap.get(featureId);
      let change    = {from: JSON.parse(JSON.stringify(rel)), to: undefined}; // string to not influence toggle edits

      let shouldPush: boolean;
      let memberIds = [];
      // push if selected node is not in members; delete if selected node is in members
      rel.members.forEach((member, index) => {
        if (member.type === 'node') {
          if (member.ref === featureId) {
            memberIds.push(member.ref);
            delete rel.members[index];
            rel.members = rel.members.filter((m) => {
              return m !== undefined;
            });
          }
        }
      });

      // when ID is not in members -> add it to members and continue to highlight
      if (memberIds.indexOf(featureId) === -1) {
        shouldPush = true;
      }

      if (shouldPush || rel.members.length === 0) {
        // node should be added if there are no members before
        let probableRole: string = '';
        switch (feature.tags.public_transport) {
          case 'platform':
          case 'station':
            probableRole = 'platform';
            break;
          case 'stop_position':
            probableRole = 'stop';
            break;
          default:
            alert('FIXME: suspicious role - ' + feature.tags.public_transport);
            probableRole = 'stop';
        }
        const memberToToggle = {
          type: 'node',
          ref : featureId,
          role: probableRole,
        };
        rel.members.push(memberToToggle);
      }

      // highlight all members (with/without selected node)
      console.log(
        'LOG (mapservice s.) This relation with members l.',
        rel, rel.members.length,
      );
      // get all members to highlight
      if (rel['members'].length > 0) {
        this.storageSrv.elementsToHighlight.clear();
        for (let member of rel.members) {
          if (member.type === 'node') {
            //  && member.ref !== featureId
            this.storageSrv.elementsToHighlight.add(member.ref);
          }
        }
      }

      change.to = rel;
      if (JSON.stringify(change.from) === JSON.stringify(change.to)) {
        console.log('FIXME: relations (before, after) are identical!');
      }
      this.addChange(rel, 'toggle members', change);

      console.log(
        'LOG (editing s.) Array highlight',
        Array.from(this.storageSrv.elementsToHighlight.values()),
      );
      const clickedNode: IPtStop = this.storageSrv.elementsMap.get(
        featureId,
      );

      // create array of circles to highlight and add to map
      let membersHighlight = [];
      for (let id of Array.from(this.storageSrv.elementsToHighlight.values())) {
        const node = this.storageSrv.elementsMap.get(id);
        console.log('LOG (editing s.) Creating circle for node:', node);
        let circle = L.circleMarker([node.lat, node.lon], {
          radius : 15,
          color  : '#00ffff',
          opacity: 0.75,
        });
        console.log('LOG (editing s.) Created circle:', circle);
        membersHighlight.push(circle);
      }
      console.log(
        'LOG (editing s.) Show all circles array membersHighlight:',
        membersHighlight,
      );
      this.mapSrv.membersHighlightLayer = L.layerGroup(membersHighlight);
      this.mapSrv.membersHighlightLayer.addTo(this.mapSrv.map);
    }
  }

  /**
   * Handles repositioning of newly created node elements.
   * @param marker
   * @param event
   */
  public repositionElement(marker: any, event: any): void {
    const opt         = event.target.options;
    const newPosition = event.target.getLatLng();
    let change        = {
      from: {
        lat: opt.lat,
        lon: opt.lng,
      },
      to  : {
        lat: newPosition.lat,
        lon: newPosition.lng,
      },
    };
    if (!this.storageSrv.elementsMap.has(opt.featureId)) {
      return alert(
        'FIXME: missing storageSrv mapping for an element? ' + opt.featureId,
      );
    }
    // update position in marker's options
    const m       = this.storageSrv.markersMap.get(opt.featureId);
    m.options.lat = newPosition.lat;
    m.options.lng = newPosition.lng;

    const element = this.storageSrv.elementsMap.get(opt.featureId);
    this.addChange(element, 'modify element', change);
  }

  /**
   * Binds events to created markers.
   * @param marker
   */
  private createNewMarkerEvents(marker: any): void {
    marker.on('dragend', (event) => {
      this.repositionElement(marker, event);
    });
    marker.on('click', (event) => {
      const featureId = marker.options.featureId;
      this.mapSrv.markerClick.emit(featureId);
    });
  }

  /**
   * Creates new marker with unique ID, icon, options and metadata attributes.
   * @param {string} creatingElementOfType
   * @param event
   * @param {number} newId
   * @returns {any}
   */
  private initializeNewMarker(
    creatingElementOfType: string,
    event: any,
    newId: number,
  ): any {
    let iconUrl;
    switch (creatingElementOfType) {
      case 'stop':
        iconUrl = require<any>('../assets/transport/bus.png');
        break;
      case 'platform':
        iconUrl = require<any>('../assets/transport/platform.png');
        break;
      default:
        iconUrl = require<any>('../../node_modules/leaflet/dist/images/marker-icon.png');
    }
    const marker                = L.marker(event['latlng'], {
      icon       : L.icon({
        iconAnchor: [10, 10],
        iconUrl,
      }),
      draggable  : true,
      opacity    : 0.8,
      riseOnHover: true,
    }).bindPopup('New ' + creatingElementOfType + ' #' + newId, {
      offset: L.point(12, 6),
    });
    marker.options['featureId'] = newId;
    marker.options['lat']       = event['latlng'].lat;
    marker.options['lng']       = event['latlng'].lng;
    return marker;
  }

  private findNewId(): number {
    let newId: number = -1;
    while (this.storageSrv.elementsMap.has(newId) && newId > -100) {
      newId--;
    }
    return newId;
  }

  /**
   * Handles switching between edits (undoing/applying changes, map move)
   * @param direction - "forward" or "backward"
   */
  public step(direction: string): void {
    // TODO
    if (direction === 'forward') {
      const edit = this.storageSrv.edits[this.currentEditStep - 1];
      console.log('LOG (editing s.) Moving forward in history');
      this.applyChange(edit);
    } else if (direction === 'backward') {
      const edit = this.storageSrv.edits[this.currentEditStep];
      console.log('LOG (editing s.) Moving backward in history');
      this.undoChange(edit);
    }
  }

  /**
   * Reorders members of a relation (stop types, platform types and other).
   * @rel
   */
  public reorderMembers(rel: IPtRelation): void {
    if (!rel.members) {
      return alert(JSON.stringify(rel) + 'FIXME please select relation');
    }

    const newOrder = [];
    rel['members'].forEach((mem) => {
      if (
        ['stop', 'stop_exit_only', 'stop_entry_only']
          .indexOf(mem['role']) > -1
      ) {
        newOrder.push(mem);
      }
    });
    rel['members'].forEach((mem) => {
      if (
        ['platform', 'platform_exit_only', 'platform_entry_only']
          .indexOf(mem['role']) > -1
      ) {
        newOrder.push(mem);
      }
    });
    rel['members'].forEach((mem) => {
      if (
        [
          'stop',
          'stop_exit_only',
          'stop_entry_only',
          'platform',
          'platform_exit_only',
          'platform_entry_only',
        ].indexOf(mem['role']) === -1
      ) {
        newOrder.push(mem);
      }
    });
    let change = {
      from: JSON.parse(JSON.stringify(rel.members)),
      to  : JSON.parse(JSON.stringify(newOrder)),
    };
    this.addChange(rel, 'change members', change);
  }

  /**
   * Checks if the last edit was made on the same tag like the new change.
   * @param editObj
   * @returns {boolean}
   */
  private shouldCombineChanges(editObj: any): boolean {
    const last = this.storageSrv.edits[
    this.storageSrv.edits.length - 1
      ];
    switch (editObj.type) {
      case 'change tags':
        return (
          last['change'].to.key === editObj.change.from.key &&
          last['change'].to.value === editObj.change.from.value
        );
      case 'change members':
        return last['id'] === editObj.id && last['type'] === 'change members';
      case 'toggle members':
        return last['id'] === editObj.id && last['type'] === 'toggle members';
    }
  }

  /**
   * Checks if last two changes are on the same tag and combines them in edit. history together.
   * @param editObj
   */
  private combineChanges(editObj: any): void {
    console.log('LOG (editing s.) Combining changes');
    const last = this.storageSrv.edits[
    this.storageSrv.edits.length - 1
      ];
    switch (editObj.type) {
      case 'change tags':
        last['change'].to.key                                   = editObj.change.to.key;
        last['change'].to.value                                 = editObj.change.to.value;
        this.storageSrv.edits[this.storageSrv.edits.length - 1] = last;
        break;
      case 'change members':
      case 'toggle members':
        last['change'].to = editObj.change.to;
        break;
    }
  }

  /**
   * Emits numbers which are visible in toolbar counter while editing.
   */
  private updateCounter(): void {
    this.currentEditStep = this.totalEditSteps = this.storageSrv.edits.length;
    this.currentTotalSteps.emit({
      current: this.currentEditStep,
      total  : this.totalEditSteps,
    });
  }

  /**
   * Checks if user browses history of edits.
   * @returns {boolean}
   */
  private isBrowsingHistoryOfChanges(): boolean {
    return this.currentEditStep < this.storageSrv.edits.length;
  }

  /**
   * Deletes all more recent edits if an user makes some change while browsing in history.
   * @param fromChangeNumber
   */
  private deleteMoreRecentChanges(fromChangeNumber: number): void {
    this.storageSrv.edits.length = fromChangeNumber;
  }

  /**
   * Applies current step of edit.
   * @param edit - edit object
   */
  private applyChange(edit: any): void {
    if (!edit.id) {
      alert('FIXME: missing edit id ' + JSON.stringify(edit));
    }
    switch (edit.type) {
      case 'add tag':
        console.log('LOG (editing s.) Should add tag: ', edit);
        const atElem                 = this.storageSrv.elementsMap.get(edit.id);
        atElem.tags[edit.change.key] = edit.change.value;
        console.log('LOG (editing s.) Added again', atElem);
        this.processSrv.refreshTagView(atElem);
        this.storageSrv.elementsMap.set(edit.id, atElem);
        break;
      case 'remove tag':
        console.log('LOG (editing s.) Should remove tag: ', edit);
        const rtElem = this.storageSrv.elementsMap.get(edit.id);
        delete rtElem.tags[edit.change.key];
        console.log('LOG (editing s.) Removed again', rtElem);
        this.processSrv.refreshTagView(rtElem);
        this.storageSrv.elementsMap.set(edit.id, rtElem);
        break;
      case 'change tag':
        console.log('LOG (editing s.) Should reapply this changed tag: ', edit);
        const chtElem = this.storageSrv.elementsMap.get(edit.id);
        delete chtElem.tags[edit.change.from.key];
        chtElem.tags[edit.change.to.key] = edit.change.to.value;
        console.log('LOG (editing s.) Changed again', chtElem);
        this.processSrv.refreshTagView(chtElem);
        this.storageSrv.elementsMap.set(edit.id, chtElem);
        break;
      case 'change members':
        console.log(
          'LOG (editing s.) Should reapply this changed members',
          edit,
        );
        let chmElem     = this.storageSrv.elementsMap.get(edit.id);
        chmElem.members = edit.change.to;
        if (chmElem.tags.type === 'route_master') {
          this.storageSrv.idsHaveMaster.add(
            chmElem.members[chmElem.members.length - 1].ref,
          );
          this.storageSrv.queriedMasters.add(
            chmElem.members[chmElem.members.length - 1].ref,
          );
        }
        this.storageSrv.elementsMap.set(edit.id, chmElem);
        this.processSrv.filterStopsByRelation(
          this.storageSrv.elementsMap.get(edit.id),
        );
        this.processSrv.exploreRelation(
          this.storageSrv.elementsMap.get(edit.id),
          false,
          false,
          false,
        );
        break;
      case 'add element':
        console.log(
          'LOG (editing s.) Should recreate this created element',
          edit,
        );
        this.storageSrv.elementsMap.set(edit.id, edit.change.to);
        this.mapSrv.map.addLayer(
          this.storageSrv.markersMap.get(edit.id),
        );
        this.processSrv.refreshTagView(
          this.storageSrv.elementsMap.get(edit.id),
        );
        break;
      case 'modify element':
        console.log(
          'LOG (editing s.) Should reapply element modification',
          edit,
        );
        const mElem = this.storageSrv.elementsMap.get(edit.id);
        mElem.lat   = edit.change.to.lat;
        mElem.lon   = edit.change.to.lon;

        const marker = this.storageSrv.markersMap.get(edit.id);
        marker.setLatLng({lat: mElem.lat, lng: mElem.lon});
        this.storageSrv.elementsMap.set(edit.id, mElem);
        break;
      case 'add route':
        console.log(
          'LOG (editing s.) Should recreate this created route',
          edit,
        );
        this.storageSrv.elementsMap.set(edit.id, edit.change.to);
        this.storageSrv.listOfRelations.push(edit.change.to);
        this.processSrv.refreshTagView(
          this.storageSrv.elementsMap.get(edit.id),
        );
        break;
      case 'toggle members':
        console.log(
          'LOG (editing s.) Should redo this membership change',
          edit,
        );
        this.storageSrv.elementsMap.set(edit.id, edit.change.to);
        this.processSrv.filterStopsByRelation(edit.change.to);
        this.processSrv.exploreRelation(
          edit.change.to,
          false,
          false,
          false,
        );
        break;
      case 'create master':
        console.log('LOG (editing s.) I should add route_master', edit);
        this.storageSrv.elementsMap.set(edit.id, edit.change.to);
        this.storageSrv.listOfMasters.push(edit.change.to); // un-shift
        let masterRel = this.storageSrv.elementsMap.get(edit.id);
        this.processSrv.refreshTagView(masterRel);
        this.processSrv.refreshRelationView(masterRel);
        break;
      default:
        alert('Current change type was not recognized ' + JSON.stringify(edit));
    }
    const element = this.processSrv.getElementById(edit['id']);
    if (edit.type === 'add element') {
      this.processSrv.exploreStop(element, false, false, false);
    }
    if (edit.type !== 'add route' || element.tags.type !== 'route_master') {
      this.processSrv.zoomToElement(element);
    }
  }

  /**
   * Undoes/deletes current step of edit.
   * @param edit - edit object
   */
  private undoChange(edit: any): void {
    switch (edit.type) {
      case 'add tag':
        console.log('LOG (editing s.) Should remove this added tag: ', edit);
        const atElem = this.storageSrv.elementsMap.get(edit.id);
        delete atElem.tags[edit.change.key];
        console.log('LOG (editing s.) Removed again', atElem);
        this.processSrv.refreshTagView(atElem);
        this.storageSrv.elementsMap.set(edit.id, atElem);
        break;
      case 'remove tag':
        console.log('LOG (editing s.) Should add this removed tag: ', edit);
        const rtElem                 = this.storageSrv.elementsMap.get(edit.id);
        rtElem.tags[edit.change.key] = edit.change.value;
        console.log('LOG (editing s.) Added again', rtElem);
        this.processSrv.refreshTagView(rtElem);
        this.storageSrv.elementsMap.set(edit.id, rtElem);
        break;
      case 'change tag':
        console.log('LOG (editing s.) Should undo this changed tag: ', edit);
        const chtElem = this.storageSrv.elementsMap.get(edit.id);
        delete chtElem.tags[edit.change.to.key];
        chtElem.tags[edit.change.from.key] = edit.change.from.value;
        console.log('LOG (editing s.) Changed again', chtElem);
        this.processSrv.refreshTagView(chtElem);
        this.storageSrv.elementsMap.set(edit.id, chtElem);
        break;
      case 'change members':
        console.log('LOG (editing s.) Should undo this changed members', edit);
        let chmElem = this.storageSrv.elementsMap.get(edit.id);
        if (chmElem.tags.type === 'route_master') {
          this.storageSrv.idsHaveMaster.delete(
            chmElem.members[chmElem.members.length - 1].ref,
          );
          this.storageSrv.queriedMasters.delete(
            chmElem.members[chmElem.members.length - 1].ref,
          );
        }
        delete chmElem.members;
        chmElem.members = edit.change.from;
        this.storageSrv.elementsMap.set(edit.id, chmElem);
        this.processSrv.filterStopsByRelation(
          this.storageSrv.elementsMap.get(edit.id),
        );
        this.processSrv.exploreRelation(
          this.storageSrv.elementsMap.get(edit.id),
          false,
          false,
          true,
        );
        break;
      case 'add element':
        console.log('LOG (editing s.) Should undo this created element', edit);
        this.mapSrv.map.removeLayer(
          this.storageSrv.markersMap.get(edit.id),
        );
        this.processSrv.refreshTagView(undefined);
        break;
      case 'modify element':
        console.log('LOG (editing s.) Should undo element modification', edit);
        const mElem = this.storageSrv.elementsMap.get(edit.id);
        mElem.lat   = edit.change.from.lat;
        mElem.lon   = edit.change.from.lon;

        const marker = this.storageSrv.markersMap.get(edit.id);
        marker.setLatLng({lat: mElem.lat, lng: mElem.lon});
        this.storageSrv.elementsMap.set(edit.id, mElem);
        break;
      case 'add route':
        console.log('LOG (editing s.) Should undo this created route', edit);
        this.storageSrv.elementsMap.set(edit.id, edit.change.to);
        this.storageSrv.listOfRelations.length =
          this.storageSrv.listOfRelations.length - 1;
        this.processSrv.refreshTagView(undefined);
        break;
      case 'toggle members':
        console.log(
          'LOG (editing s.) Should undo this membership change',
          edit,
        );
        this.storageSrv.elementsMap.set(edit.id, edit.change.from);
        this.processSrv.filterStopsByRelation(edit.change.from);
        this.processSrv.exploreRelation(
          edit.change.from,
          false,
          false,
          true,
        );
        break;
      case 'create master':
        console.log(
          'LOG (editing s.) Should undo this route_master creation',
          edit,
        );
        this.storageSrv.listOfMasters.pop();
        this.processSrv.refreshTagView(undefined);
        break;
      default:
        alert('Current change type was not recognized ' + JSON.stringify(edit));
    }
    const element = this.processSrv.getElementById(edit['id']);
    if (edit.type === 'add element') {
      this.processSrv.exploreStop(element, false, false, false);
    }
    if (edit.type !== 'add route') {
      this.processSrv.zoomToElement(element);
    }
  }

  /**
   * Deletes all unnecessary attributes from member object in a relation.
   * @param editObj
   */
  private simplifyMembers(editObj: any): void {
    for (const member of editObj.change.to) {
      for (const key of Object.keys(member)) {
        if (['type', 'ref', 'role'].indexOf(key) === -1) {
          delete member[key];
        }
      }
    }
  }

  /**
   * Compares strings of from/to changes in the edited object.
   * @param editObj
   * @returns {boolean}
   */
  private changeIsEqual(editObj: any): boolean {
    console.log(
      JSON.stringify(editObj.change.from).length,
      JSON.stringify(editObj.change.to).length,
    );
    return (
      JSON.stringify(editObj.change.from) === JSON.stringify(editObj.change.to)
    );
  }

  public createAutomaticRoute(): any {
    this.modalRef = this.modalService.show(RouteModalComponent, {class: 'modal-lg'});
    console.log('stops in bounds and having route ref tag');
  }
}

import { Component } from '@angular/core';

import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

@Component({
  providers: [],
  selector: 'route-browser',
  styles: [
    require<any>('./route-browser.component.less'),
    require<any>('../../styles/main.less'),
  ],
  templateUrl: './route-browser.component.html',
})
export class RouteBrowserComponent {
  private currentElement;
  private listOfMasters: object[] = this.storageSrv.listOfMasters;
  private listOfRelations: object[] = this.storageSrv.listOfRelations;
  private listOfRelationsForStop: object[] = this.storageSrv.listOfRelationsForStop;

  private isRequesting: boolean;
  private filteredView: boolean;
  private idsHaveMaster = new Set();
  private editingMode: boolean;
  private membersEditing: boolean = false;

  constructor(
    private editSrv: EditService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
  ) {
    //
  }

  ngOnInit(): void {
    this.processSrv.showRelationsForStop$.subscribe((data) => {
      this.filteredView = data;
    });
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === 'route') {
        this.listOfRelationsForStop = this.storageSrv.listOfRelationsForStop;
        this.currentElement = this.storageSrv.currentElement;
      } else if (data === 'tag') {
        this.currentElement = this.storageSrv.currentElement;
      } else if (data === 'cancel selection') {
        this.currentElement = undefined;
        delete this.currentElement;
      }
    });
    this.processSrv.refreshMasters.subscribe((data) => {
      this.isRequesting = false;
      data['idsHaveMaster'].forEach((id) => {
        this.idsHaveMaster.add(id);
      });
    });
    this.editSrv.editingMode.subscribe((data) => {
      console.log(
        'LOG (route-browser) Editing mode change in routeBrowser - ',
        data,
      );
      this.editingMode = data;
    });
  }

  private toggleMembersEdit(): void {
    this.membersEditing = !this.membersEditing;
    this.mapSrv.membersEditing = this.membersEditing;
    if (this.membersEditing) {
      console.log(
        'LOG (route-browser) Toggle members edit',
        this.membersEditing,
        this.storageSrv.currentElement,
      );
      this.editSrv.redrawMembersHighlight();
    } else {
      this.mapSrv.clearCircleHighlight();
    }
  }

  private hasMaster(relId: number): boolean {
    return this.storageSrv.idsHaveMaster.has(relId);
  }

  private isDownloaded(relId: number): boolean {
    return this.storageSrv.elementsDownloaded.has(relId);
  }

  private masterWasChecked(relId: number): boolean {
    return this.storageSrv.queriedMasters.has(relId);
  }

  private cancelFilter(): void {
    this.processSrv.activateFilteredRouteView(false);
  }

  /**
   * Explores relations on click (together with the request to API)
   * @param $event
   * @param rel
   */
  private exploreRelation($event: any, rel: any): void {
    this.processSrv.exploreRelation(
      this.storageSrv.elementsMap.get(rel.id),
      true,
      true,
      true,
    );
  }

  /**
   * Explores already available relations on hover (without delay and additional requests)
   * @param $event
   * @param rel
   */
  private exploreAvailableRelation($event: any, rel: any): void {
    if (this.storageSrv.elementsDownloaded.has(rel.id)) {
      this.processSrv.exploreRelation(
        this.storageSrv.elementsMap.get(rel.id),
        true,
        true,
        true,
      );
    }
  }

  private exploreMaster($event: any, rel: any): void {
    this.processSrv.exploreMaster(
      this.storageSrv.elementsMap.get(rel.id),
    );
  }

  private downloadMaster(): void {
    this.isRequesting = true;
    console.log('LOG (route-browser) Manually downloading masters');
    this.overpassSrv.getRouteMasters(1);
  }

  private createRoute(): void {
    this.editSrv.createRoute();
  }

  private elementShouldBeEditable(): boolean {
    if (this.currentElement) {
      return (
        this.currentElement.type === 'relation' &&
        this.currentElement.tags.type === 'route'
      );
    } else {
      return false;
    }
  }

  private isSelected(relId: number): boolean {
    return this.processSrv.haveSameIds(relId, this.currentElement.id);
  }

  private visibleInMap(relId: any): string {
    const rel = this.storageSrv.elementsMap.get(relId);
    let nodesCounter = 0;
    for (const member of rel.members) {
      if (member.type === 'node') {
        nodesCounter++;
        if (this.storageSrv.elementsMap.has(member.ref)) {
          const element = this.storageSrv.elementsMap.get(member.ref);
          if (
            this.mapSrv.map.getBounds().contains({
              lat: element.lat,
              lng: element.lon,
            })
          ) {
            return 'visible'; // return true while at least first node is visible
          }
        }
      }
    }
    if (rel.members.length === 0 || nodesCounter === 0) {
      return 'warning'; // empty routes or without nodes (lat/lon) are always visible
    }
    return 'hidden';
  }

  /**
   * NgFor track function which helps to re-render rows faster.
   *
   * @param index
   * @param item
   * @returns {number}
   */
  private trackByFn(index: number, item: any): number {
    return item.id;
  }
}

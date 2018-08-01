import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

import { Observable } from 'rxjs';

import { IRouteBrowserOptions } from '../../core/editingOptions.interface';

import { NgRedux, select } from '@angular-redux/store';

import { IAppState } from '../../store/model';
import { AppActions } from '../../store/app/actions';
import {TutorialService} from '../../services/tutorial.service';

@Component({
  providers: [],
  selector: 'route-browser',
  styleUrls: [
    './route-browser.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './route-browser.component.html',
})
export class RouteBrowserComponent implements OnInit, OnDestroy {
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;

  public currentElement;
  public listOfMasters: object[] = this.storageSrv.listOfMasters;
  public listOfRelations: object[] = this.storageSrv.listOfRelations;
  public listOfRelationsForStop: object[] = this.storageSrv.listOfRelationsForStop;

  public isRequesting: boolean;
  public filteredView: boolean;
  private idsHaveMaster = new Set();
  public membersEditing: boolean = false;
  @Input() routeBrowserOptions: IRouteBrowserOptions;
  @select(['app', 'advancedExpMode']) public readonly advancedExpMode$: Observable<boolean>;
  private advancedExpModeSubscription: any;
  private advancedExpMode: boolean;
  constructor(
    private editSrv: EditService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>,
    private appActions: AppActions,
    private tutorialSrv: TutorialService,
  ) {
    this.advancedExpModeSubscription = ngRedux.select<boolean>(['app', 'advancedExpMode'])
      .subscribe((data) => this.advancedExpMode = data);
  }

  public ngOnInit(): void {
    if (!this.routeBrowserOptions.toggleFilteredView) {
      this.filteredView = true;
    }
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
    if (this.ngRedux.getState()['app']['tutorialMode'] === false) {
      this.storageSrv.tutorialStepCompleted.emit(1);
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
    if (!this.advancedExpMode) {
      this.processSrv.refreshTagView(rel);
      this.appActions.actSetBeginnerView('route');
      this.processSrv.exploreRelation(
      this.storageSrv.elementsMap.get(rel.id),
        true,
        false,
        false,
      );
    }
    else {
      this.processSrv.exploreRelation(
        this.storageSrv.elementsMap.get(rel.id),
        true,
        true,
        true,
      );
    }
  }

  /**
   * Explores already available relations on hover (without delay and additional requests)
   * @param $event
   * @param rel
   */
  private exploreAvailableRelation($event: any, rel: any): void {
    if (this.storageSrv.elementsDownloaded.has(rel.id) && this.advancedExpMode) {
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
    if (this.ngRedux.getState()['app']['tutorialMode'] === false) {
      this.storageSrv.tutorialStepCompleted.emit(4);
    }
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

  /**
   * Explores stop for beginner view (used for mouseout event for route list).
   * @returns {void}
   */
  private exploreStop(): void {
    if (!this.advancedExpMode) {
      this.processSrv.exploreStop(this.storageSrv.currentElement, false, false, true);
    }
  }

  ngOnDestroy(): void {
  this.advancedExpModeSubscription.unsubscribe();
  }
}

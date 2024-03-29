import { NgRedux, select } from '@angular-redux/store';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { Observable } from 'rxjs';
import { IRouteBrowserOptions } from '../../core/editingOptions.interface';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';

@Component({
  providers: [],
  selector: 'route-browser',
  styleUrls: ['./route-browser.component.less', '../../styles/main.less'],
  templateUrl: './route-browser.component.html',
})
export class RouteBrowserComponent implements OnInit, OnDestroy {
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;

  currentElement;
  listOfMasters: object[] = this.storageSrv.listOfMasters;
  listOfRelations: object[] = this.storageSrv.listOfRelations;
  listOfRelationsForStop: object[] = this.storageSrv.listOfRelationsForStop;

  isRequesting: boolean;
  filteredView: boolean;
  private idsHaveMaster = new Set();
  membersEditing = false;
  @Input() routeBrowserOptions: IRouteBrowserOptions;
  @select(['app', 'advancedExpMode'])
  readonly advancedExpMode$: Observable<boolean>;
  private advancedExpModeSubscription;
  private advancedExpMode: boolean;
  constructor(
    private editSrv: EditService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>,
    private appActions: AppActions,
    private hotkeysService: HotkeysService
  ) {
    this.advancedExpModeSubscription = ngRedux
      .select<boolean>(['app', 'advancedExpMode'])
      .subscribe((data) => (this.advancedExpMode = data));
    this.hotkeysService.add([
      new Hotkey(
        '2',
        (event: KeyboardEvent): boolean => {
          if (
            this.ngRedux.getState()['app']['editing'] &&
            this.ngRedux.getState()['app']['advancedExpMode']
          ) {
            this.createRoute();
          }
          return false;
        },
        undefined,
        'Create a new route'
      ),
      new Hotkey(
        'shift+2',
        (event: KeyboardEvent): boolean => {
          if (
            this.ngRedux.getState()['app']['editing'] &&
            this.ngRedux.getState()['app']['advancedExpMode']
          ) {
            this.toggleMembersEdit();
          }
          return false;
        },
        undefined,
        'Toggle editing members of the selected route'
      ),
    ]);
  }

  ngOnInit(): void {
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

  toggleMembersEdit(): void {
    this.membersEditing = !this.membersEditing;
    this.mapSrv.membersEditing = this.membersEditing;
    if (this.membersEditing) {
      console.log(
        'LOG (route-browser) Toggle members edit',
        this.membersEditing,
        this.storageSrv.currentElement
      );
      this.editSrv.redrawMembersHighlight();
    } else {
      this.mapSrv.clearCircleHighlight();
    }
    this.storageSrv.tutorialStepCompleted.emit('click change members');
  }

  hasMaster(relId: number): boolean {
    return this.storageSrv.idsHaveMaster.has(relId);
  }

  isDownloaded(relId: number): boolean {
    return this.storageSrv.elementsDownloaded.has(relId);
  }

  masterWasChecked(relId: number): boolean {
    return this.storageSrv.queriedMasters.has(relId);
  }

  cancelFilter(): void {
    this.processSrv.activateFilteredRouteView(false);
  }

  /**
   * Explores relations on click (together with the request to API)
   */
  exploreRelation($event, rel): void {
    if (!this.advancedExpMode) {
      this.processSrv.refreshTagView(rel);
      this.appActions.actSetBeginnerView('route');
      this.processSrv.exploreRelation(
        this.storageSrv.elementsMap.get(rel.id),
        true,
        false,
        false
      );
      this.storageSrv.tutorialStepCompleted.emit('click route from list');
    } else {
      this.processSrv.exploreRelation(
        this.storageSrv.elementsMap.get(rel.id),
        true,
        true,
        true
      );
    }
  }

  /**
   * Explores already available relations on hover (without delay and additional requests)
   */
  exploreAvailableRelation($event, rel): void {
    if (
      this.storageSrv.elementsDownloaded.has(rel.id) &&
      this.advancedExpMode
    ) {
      this.processSrv.exploreRelation(
        this.storageSrv.elementsMap.get(rel.id),
        true,
        true,
        true
      );
    }
  }

  exploreMaster($event, rel): void {
    this.processSrv.exploreMaster(this.storageSrv.elementsMap.get(rel.id));
  }

  downloadMaster(): void {
    this.isRequesting = true;
    console.log('LOG (route-browser) Manually downloading masters');
    this.overpassSrv.getRouteMasters(1);
  }

  createRoute(): void {
    this.editSrv.createRoute();
    this.storageSrv.tutorialStepCompleted.emit('click create route button');
  }

  elementShouldBeEditable(): boolean {
    if (this.currentElement) {
      return (
        this.currentElement.type === 'relation' &&
        this.currentElement.tags.type === 'route'
      );
    } else {
      return false;
    }
  }

  isSelected(relId: number): boolean {
    return this.processSrv.haveSameIds(relId, this.currentElement.id);
  }

  visibleInMap(relId): string {
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
   */
  trackByFn(index: number, item): number {
    return item.id;
  }

  /**
   * Explores stop for beginner view (used for mouseout event for route list).
   */
  private exploreStop(): void {
    if (!this.advancedExpMode) {
      this.processSrv.exploreStop(
        this.storageSrv.currentElement,
        false,
        false,
        true
      );
    }
  }

  ngOnDestroy(): void {
    this.advancedExpModeSubscription.unsubscribe();
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';

import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { EditService } from '../../services/edit.service';
import { ModalDirective } from 'ngx-bootstrap';

import { IPtRouteMasterNew } from '../../core/ptRouteMasterNew.interface';
import { IOsmElement } from '../../core/osmElement.interface';

import { Observable } from 'rxjs';

import { NgRedux, select } from '@angular-redux/store';
import { IAppState } from '../../store/model';

import { Hotkey, HotkeysService } from 'angular2-hotkeys';

@Component({
  providers: [],
  selector: 'relation-browser',
  styleUrls: [
    './relation-browser.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './relation-browser.component.html',
})
export class RelationBrowserComponent implements OnInit {
  currentElement: IOsmElement | IPtRouteMasterNew;
  public listOfVariants = this.storageSrv.listOfVariants;
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  public listOfMasters = this.storageSrv.listOfMasters;

  constructor(
    private editSrv: EditService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private hotkeysService: HotkeysService,
    private ngRedux: NgRedux<IAppState>,
  ) {
    this.hotkeysService.add(new Hotkey('3', (): boolean => {
      if (this.ngRedux.getState()['app']['editing'] && this.ngRedux.getState()['app']['advancedExpMode']) {

        this.createMaster();
      }
      return false;
    }, undefined, 'Create a new route master'));
  }

  public ngOnInit(): void {
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === 'tag') {
        console.log('LOG (relation-browser) Current selected element changed - ', data);
        if (this.storageSrv.currentElement.tags.type === 'route_master') {
          // prevent showing members of everything except route_master
          this.currentElement = this.storageSrv.currentElement;
        }
      } else if (data === 'cancel selection') {
        this.currentElement = undefined;
        delete this.currentElement;
        this.storageSrv.listOfVariants.length = 0;
        this.listOfVariants.length = 0;
      }
    });

    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === 'relation') {
        this.listOfVariants = this.storageSrv.listOfVariants;
        console.log('LOG (relation-browser) List of variants ', this.storageSrv.listOfVariants,
          ' currentElement', this.storageSrv.currentElement);
      }
    });
  }

  /**
   * NgFor track function which helps to re-render rows faster.
   *
   * @param index
   * @param item
   * @returns {number}
   */
  public trackByFn(index: number, item: any): number {
    return item.id;
  }

  public hideMasterModal(): void {
    this.masterModal.hide();
  }

  isDownloaded(relId: number): boolean {
    return this.storageSrv.elementsDownloaded.has(relId) || relId < 0; // show created
  }

  exploreRelation($event: any, relId: number): void {
    this.processSrv.exploreRelation(
      this.storageSrv.elementsMap.get(relId),
      true,
      false,
      true,
    );
  }

  hasMaster(): boolean {
    if (this.currentElement) {
      return this.storageSrv.idsHaveMaster.has(this.currentElement.id); // create only one route_master for each element
    }
    return false; // turned on to create route_masters without members
  }

  createMaster(): void {
    // FIXME - allow to create route_master of route_masters later
    if (
      this.currentElement &&
      this.currentElement.tags.type !== 'route_master'
    ) {
      this.editSrv.createMaster(this.currentElement.id);
    } else {
      this.editSrv.createMaster();
    }
  }
  changeRouteMasterMembers(routeMasterId: number): void {
    this.editSrv.changeRouteMasterMembers(
      this.currentElement.id,
      routeMasterId,
    );
  }

  @ViewChild('masterModal') public masterModal: ModalDirective;

  public showMasterModal(): void {
    this.masterModal.show();
    // this.mapSrv.disableMouseEvent("modalDownload");
  }

  isAlreadyAdded(relId: number): boolean {
    if (!this.currentElement) {
      return;
    }
    let rel = this.storageSrv.elementsMap.get(relId);
    let found = rel.members.filter((member) => {
      return member.ref === this.currentElement.id;
    });
    return found.length > 0;
  }

  isSelected(relId: number): boolean {
    return this.processSrv.haveSameIds(relId, this.currentElement.id);
  }
}

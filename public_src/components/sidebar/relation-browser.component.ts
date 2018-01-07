import { Component, ViewChild } from "@angular/core";

import { ProcessService } from "../../services/process.service";
import { StorageService } from "../../services/storage.service";
import { EditService } from "../../services/edit.service";
import { ModalDirective } from "ngx-bootstrap";

import { IPtRouteMasterNew } from "../../core/ptRouteMasterNew.interface";

@Component({
  providers: [],
  selector: "relation-browser",
  styles: [
    require<any>("./relation-browser.component.less"),
    require<any>("../../styles/main.less"),
  ],
  template: require<any>("./relation-browser.component.html"),
})
export class RelationBrowserComponent {
  private currentElement: IPtRouteMasterNew;
  private listOfVariants = this.storageSrv.listOfVariants;
  private editingMode: boolean;
  private listOfMasters = this.storageSrv.listOfMasters;

  constructor(
    private editSrv: EditService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
  ) {
    //
  }

  ngOnInit(): void {
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === "tag") {
        console.log("LOG (relation-browser) Current selected element changed - ", data);
        if (this.storageSrv.currentElement.tags.type === "route_master") {
          // prevent showing members of everything except route_master
          this.currentElement = this.storageSrv.currentElement;
        }
      } else if (data === "cancel selection") {
        this.currentElement = undefined;
        delete this.currentElement;
        this.storageSrv.listOfVariants.length = 0;
        this.listOfVariants.length = 0;
      }
    });

    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === "relation") {
        this.listOfVariants = this.storageSrv.listOfVariants;
        console.log("LOG (relation-browser) List of variants ", this.storageSrv.listOfVariants,
          " currentElement", this.storageSrv.currentElement);
      }
    });
    this.editSrv.editingMode.subscribe((data) => {
      console.log("LOG (relation-browser) Editing mode change in routeBrowser - ", data);
      this.editingMode = data;
    });
  }

  private isDownloaded(relId: number): boolean {
    return this.storageSrv.elementsDownloaded.has(relId) || relId < 0; // show created
  }

  private exploreRelation($event: any, relId: number): void {
    this.processSrv.exploreRelation(
      this.storageSrv.elementsMap.get(relId),
      true,
      false,
      true,
    );
  }

  private hasMaster(): boolean {
    if (this.currentElement) {
      return this.storageSrv.idsHaveMaster.has(this.currentElement.id); // create only one route_master for each element
    }
    return false; // turned on to create route_masters without members
  }

  private createMaster(): void {
    // FIXME - allow to create route_master of route_masters later
    if (
      this.currentElement &&
      this.currentElement.tags.type !== "route_master"
    ) {
      this.editSrv.createMaster(this.currentElement.id);
    } else {
      this.editSrv.createMaster();
    }
  }

  private changeRouteMasterMembers(routeMasterId: number): void {
    this.editSrv.changeRouteMasterMembers(
      this.currentElement.id,
      routeMasterId,
    );
  }

  @ViewChild("masterModal") public masterModal: ModalDirective;
  public showMasterModal(): void {
    this.masterModal.show();
    // this.mapSrv.disableMouseEvent("modalDownload");
  }

  private hideMasterModal(): void {
    this.masterModal.hide();
  }

  private isAlreadyAdded(relId: number): boolean {
    if (!this.currentElement) {
      return;
    }
    let rel = this.storageSrv.elementsMap.get(relId);
    let found = rel.members.filter((member) => {
      return member.ref === this.currentElement.id;
    });
    if (found.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  private isSelected(relId: number): boolean {
    return this.processSrv.haveSameIds(relId, this.currentElement.id);
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

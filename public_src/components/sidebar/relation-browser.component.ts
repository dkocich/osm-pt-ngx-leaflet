import { Component, ViewChild } from "@angular/core";

import { ProcessingService } from "../../services/processing.service";
import { StorageService } from "../../services/storage.service";
import { EditingService } from "../../services/editing.service";
import { ModalDirective } from "ngx-bootstrap";

import { IPtRouteMasterNew } from "../../core/ptRouteMasterNew.interface";

@Component({
    providers: [],
    selector: "relation-browser",
    styles: [
        require<any>("./relation-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    template: require<any>("./relation-browser.component.html")
})
export class RelationBrowserComponent {
    private currentElement: IPtRouteMasterNew;
    private listOfVariants = this.storageService.listOfVariants;
    private editingMode: boolean;
    private listOfMasters = this.storageService.listOfMasters;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private editingService: EditingService) {
    }

    ngOnInit(): void {
        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "tag") {
                    console.log("LOG (relation-browser) Current selected element changed - ", data);
                    if (this.storageService.currentElement.tags.type === "route_master") { // prevent showing members of everything except route_master
                        this.currentElement = this.storageService.currentElement;
                    }
                } else if (data === "cancel selection") {
                    this.currentElement = undefined;
                    delete this.currentElement;
                    this.storageService.listOfVariants.length = 0;
                    this.listOfVariants.length = 0;
                }
            }
        );

        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "relation") {
                    this.listOfVariants = this.storageService.listOfVariants;
                    console.log("LOG (relation-browser) List of variants " , this.storageService.listOfVariants,
                        " currentElement", this.storageService.currentElement);
                }
            }
        );
        this.editingService.editingMode.subscribe(
            (data) => {
                console.log("LOG (relation-browser) Editing mode change in routeBrowser - ", data);
                this.editingMode = data;
            }
        );
    }

    private isDownloaded(relId: number): boolean {
        return this.storageService.elementsDownloaded.has(relId) || relId < 0; // show created
    }

    private exploreRelation($event: any, relId: number): void {
        this.processingService.exploreRelation(this.storageService.elementsMap.get(relId),
            true, false, true);
    }

    private hasMaster(): boolean {
        if (this.currentElement) {
            return this.storageService.idsHaveMaster.has(this.currentElement.id); // create only one route_master for each element
        }
        return false; // turned on to create route_masters without members
    }

    private createMaster(): void {
        // FIXME - allow to create route_master of route_masters later
        if (this.currentElement && this.currentElement.tags.type !== "route_master") {
            this.editingService.createMaster(this.currentElement.id);
        } else {
            this.editingService.createMaster();
        }
    }

    private changeRouteMasterMembers(routeMasterId: number): void {
        this.editingService.changeRouteMasterMembers(this.currentElement.id, routeMasterId);
    }

    @ViewChild("masterModal") public masterModal: ModalDirective;
    public showMasterModal(): void {
        this.masterModal.show();
        // this.mapService.disableMouseEvent("modalDownload");
    }

    private hideMasterModal(): void {
        this.masterModal.hide();
    }

    private isAlreadyAdded(relId: number): boolean {
        if (!this.currentElement) {
            return;
        }
        let rel = this.storageService.elementsMap.get(relId);
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
        return this.processingService.haveSameIds(relId, this.currentElement.id);
    }
}

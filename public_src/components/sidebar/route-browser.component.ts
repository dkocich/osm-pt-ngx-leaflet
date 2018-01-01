import { Component } from "@angular/core";

import { EditingService } from "../../services/editing.service";
import { MapService } from "../../services/map.service";
import { OverpassService } from "../../services/overpass.service";
import { ProcessingService } from "../../services/processing.service";
import { StorageService } from "../../services/storage.service";

@Component({
    providers: [],
    selector: "route-browser",
    styles: [
        require<any>("./route-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    template: require<any>("./route-browser.component.html")
})
export class RouteBrowserComponent {
    private currentElement;
    private listOfMasters: object[] = this.storageService.listOfMasters;
    private listOfRelations: object[] = this.storageService.listOfRelations;
    private listOfRelationsForStop: object[] = this.storageService.listOfRelationsForStop;

    private isRequesting: boolean;
    private filteredView: boolean;
    private idsHaveMaster = new Set();
    private editingMode: boolean;
    private membersEditing: boolean = false;

    constructor(
        private editingService: EditingService,
        private mapService: MapService,
        private overpassService: OverpassService,
        private processingService: ProcessingService,
        private storageService: StorageService
    ) {
        //
    }

    ngOnInit(): void {
        this.processingService.showRelationsForStop$.subscribe(
            (data) => {
                this.filteredView = data;
            }
        );
        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "route") {
                    this.listOfRelationsForStop = this.storageService.listOfRelationsForStop;
                    this.currentElement = this.storageService.currentElement;
                } else if (data === "tag") {
                    this.currentElement = this.storageService.currentElement;
                } else if (data === "cancel selection") {
                    this.currentElement = undefined;
                    delete this.currentElement;
                }
            }
        );
        this.processingService.refreshMasters.subscribe(
          (data) => {
              this.isRequesting = false;
              data["idsHaveMaster"].forEach((id) => {
                  this.idsHaveMaster.add(id);
              });
          }
        );
        this.editingService.editingMode.subscribe(
            (data) => {
                console.log("LOG (route-browser) Editing mode change in routeBrowser - ", data);
                this.editingMode = data;
            }
        );
    }

    private toggleMembersEdit(): void {
        this.membersEditing = !this.membersEditing;
        this.mapService.membersEditing = this.membersEditing;
        if (this.membersEditing) {
            console.log("LOG (route-browser) Toggle members edit", this.membersEditing, this.storageService.currentElement);
            this.editingService.redrawMembersHighlight();
        } else {
            this.mapService.clearCircleHighlight();
        }
    }

    private hasMaster(relId: number): boolean {
        return this.storageService.idsHaveMaster.has(relId);
    }

    private isDownloaded(relId: number): boolean {
        return this.storageService.elementsDownloaded.has(relId);
    }

    private masterWasChecked(relId: number): boolean {
        return this.storageService.queriedMasters.has(relId);
    }

    private cancelFilter(): void {
        this.processingService.activateFilteredRouteView(false);
    }

    /**
     * Explores relations on click (together with the request to API)
     * @param $event
     * @param rel
     */
    private exploreRelation($event: any, rel: any): void {
        this.processingService.exploreRelation(this.storageService.elementsMap.get(rel.id),
            true, true, true);
    }

    /**
     * Explores already available relations on hover (without delay and additional requests)
     * @param $event
     * @param rel
     */
    private exploreAvailableRelation($event: any, rel: any): void {
        if (this.storageService.elementsDownloaded.has(rel.id)) {
            this.processingService.exploreRelation(this.storageService.elementsMap.get(rel.id),
                true, true, true);
        }
    }

    private exploreMaster($event: any, rel: any): void {
        this.processingService.exploreMaster(this.storageService.elementsMap.get(rel.id));
    }

    private downloadMaster(): void {
        this.isRequesting = true;
        console.log("LOG (route-browser) Manually downloading masters");
        this.overpassService.getRouteMasters(1);
    }

    private createRoute(): void {
        this.editingService.createRoute();
    }

    private elementShouldBeEditable(): boolean {
        if (this.currentElement) {
            return this.currentElement.type === "relation" && this.currentElement.tags.type === "route";
        } else {
            return false;
        }
    }

    private isSelected(relId: number): boolean {
        return this.processingService.haveSameIds(relId, this.currentElement.id);
    }

    private visibleInMap(relId: any): string {
        const rel = this.storageService.elementsMap.get(relId);
        let nodesCounter = 0;
        for (const member of rel.members) {
            if (member.type === "node") {
                nodesCounter++;
                if (this.storageService.elementsMap.has(member.ref)) {
                    const element = this.storageService.elementsMap.get(member.ref);
                    if (this.mapService.map.getBounds().contains({
                            lat: element .lat, lng: element .lon })) {
                        return "visible"; // return true while at least first node is visible
                    }
                }
            }
        }
        if (rel.members.length === 0 || nodesCounter === 0) {
            return "warning"; // empty routes or without nodes (lat/lon) are always visible
        }
        return "hidden";
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

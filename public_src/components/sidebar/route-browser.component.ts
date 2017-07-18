import {Component} from "@angular/core";

import {MapService} from "../../services/map.service";
import {OverpassService} from "../../services/overpass.service";
import {ProcessingService} from "../../services/processing.service";
import {StorageService} from "../../services/storage.service";

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
    private listOfMasters: object[] = this.storageService.listOfMasters;
    private listOfRelations: object[] = this.storageService.listOfRelations;
    private listOfRelationsForStop: object[] = this.storageService.listOfRelationsForStop;

    private isRequesting: boolean;
    private filteredView: boolean;
    private idsHaveMaster = new Set();

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private mapService: MapService,
                private overpassService: OverpassService) {
    }

    ngOnInit() {
        this.processingService.showRelationsForStop$.subscribe(
            (data) => {
                this.filteredView = data;
            }
        );
        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "route") {
                    this.listOfRelationsForStop = this.storageService.listOfRelationsForStop;
                }
            }
        );
        this.processingService.refreshMasters.subscribe(
          (data) => {
              this.isRequesting = false;
              data["idsHaveMaster"].forEach( (id) => this.idsHaveMaster.add(id) );
          }
        );
    }

    private hasMaster(relId: number): boolean {
        return this.idsHaveMaster.has(relId);
    }

    private cancelFilter(): void {
        this.processingService.activateFilteredRouteView(false);
    }

    private exploreRelation($event, rel: any): void {
        this.processingService.exploreRelation(rel);
    }

    private exploreMaster($event, rel: any): void {
        this.processingService.exploreMaster(rel);
    }

    private downloadMaster() {
        this.isRequesting = true;
        console.log("LOG (route-browser) manually downloading masters");
        this.overpassService.getRouteMasters(1);
    }
}

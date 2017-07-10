import {Component} from "@angular/core";
import {StorageService} from "../../services/storage.service";
import {MapService} from "../../services/map.service";
import {ProcessingService} from "../../services/processing.service";

@Component({
    selector: "route-browser",
    template: require<any>("./route-browser.component.html"),
    styles: [
        require<any>("./route-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class RouteBrowserComponent {
    private listOfMasters: object[] = this.storageService.listOfMasters;
    private listOfRelations: object[] = this.storageService.listOfRelations;
    private listOfRelationsForStop: object[] = this.storageService.listOfRelationsForStop;

    private filteredView: boolean;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private mapService: MapService) {
    }

    ngOnInit() {
        this.processingService.showRelationsForStop$.subscribe(
            data => {
                this.filteredView = data;
            }
        );
        this.processingService.refreshSidebarViews$.subscribe(
            data => {
                if (data === "route") {
                    this.listOfRelationsForStop = this.storageService.listOfRelationsForStop;
                }
            }
        );
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
}

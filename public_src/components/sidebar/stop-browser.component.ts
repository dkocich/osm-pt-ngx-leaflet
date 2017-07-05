import {Component} from "@angular/core";
import {StorageService} from "../../services/storage.service";
import {MapService} from "../../services/map.service";
import {ProcessingService} from "../../services/processing.service";
import {EditingService} from "../../services/editing.service";

@Component({
    selector: "stop-browser",
    template: require<any>("./stop-browser.component.html"),
    styles: [
        require<any>("./stop-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class StopBrowserComponent {
    private listOfStops: object[] = this.storageService.listOfStops;
    public listOfStopsForRoute: object[] = this.storageService.listOfStopsForRoute;
    private filteredView: boolean;
    private editingMode: boolean;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private mapService: MapService,
                private editingService: EditingService) {
    }

    ngOnInit() {
        this.processingService.showStopsForRoute$.subscribe(
            data => {
                this.filteredView = data;
            }
        );

        this.processingService.refreshSidebarViews$.subscribe(
            data => {
                if (data === "stop") {
                    this.listOfStopsForRoute = this.storageService.listOfStopsForRoute;
                }
            }
        );

        this.editingService.editingMode.subscribe(
            /**
             * @param data
             */
            (data) => {
                console.log("Editing mode change in stopBrowser - ", data);
                this.editingMode = data;
            }
        );
    }

    private cancelFilter() {
        this.processingService.activateFilteredStopView(false);
    }

    private exploreStop($event, stop) {
        this.processingService.exploreStop(stop);
    }
}

import { Component } from "@angular/core";

import { EditingService } from "../../services/editing.service";
import { MapService } from "../../services/map.service";
import { ProcessingService } from "../../services/processing.service";
import { StorageService } from "../../services/storage.service";
import { DragulaService } from "ng2-dragula";

import { IPtRelation } from "../../core/ptRelation.interface";
import { IPtStop } from "../../core/ptStop.interface";

@Component({
    providers: [],
    selector: "stop-browser",
    styles: [
        require<any>("./stop-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    template: require<any>("./stop-browser.component.html")
})
export class StopBrowserComponent {
    public listOfStopsForRoute: object[] = this.storageService.listOfStopsForRoute;
    private currentElement: any;
    private listOfStops: object[] = this.storageService.listOfStops;
    private filteredView: boolean;
    private editingMode: boolean;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private mapService: MapService,
                private editingService: EditingService,
                private dragulaService: DragulaService) {
        dragulaService.drop.subscribe((value) => {
            this.onDrop(value.slice(1));
        });
    }

    ngOnInit(): void {
        this.processingService.showStopsForRoute$.subscribe(
            (data) => {
                this.filteredView = data;
            }
        );

        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "stop") {
                    this.listOfStopsForRoute = this.storageService.listOfStopsForRoute;
                    this.currentElement = this.storageService.currentElement;
                    console.log(this.currentElement, this.listOfStopsForRoute);
                } else if (data === "tag") {
                    this.currentElement = this.storageService.currentElement;
                } else if (data === "cancel selection") {
                    this.listOfStopsForRoute = undefined;
                    delete this.listOfStopsForRoute;
                    this.currentElement = undefined;
                    delete this.currentElement;
                    this.filteredView = false;
                }
            }
        );

        this.editingService.editingMode.subscribe(
            /**
             * @param data
             */
            (data) => {
                console.log("LOG (stop-browser) Editing mode change in stopBrowser - ", data);
                this.editingMode = data;
            }
        );
    }

    private isDownloaded(nodeId: number) {
        return this.storageService.elementsDownloaded.has(nodeId);
    }

    private reorderMembers(rel: IPtRelation): void {
        this.editingService.reorderMembers(rel);
    }

    private createChange(): void {
        const type = "change members";
        let elementsWithoutRole = this.currentElement["members"].filter( (member) => {
            return member["role"] === "";
        });
        let change = {
            from: JSON.parse(JSON.stringify(this.currentElement["members"])),
            to: JSON.parse(JSON.stringify([...this.listOfStopsForRoute, ...elementsWithoutRole]))
        };
        this.editingService.addChange(this.currentElement, type, change);
    }

    private onDrop(args: any): void {
        if (this.currentElement.type !== "relation") {
            return alert("Current element has incorrent type. Select relation one more time please.");
        }
        this.createChange();
    }

    private cancelFilter(): void {
        this.processingService.activateFilteredStopView(false);
    }

    private exploreStop($event: any, stop: IPtStop): void {
        this.processingService.exploreStop(stop, true, true, true);
    }

    private reorderingEnabled(): boolean {
        if (this.currentElement) {
            return this.currentElement.type === "relation" && this.filteredView;
        } else {
            return false;
        }
    }

    private isSelected(relId: number): boolean {
        return this.processingService.haveSameIds(relId, this.currentElement.id);
    }
}

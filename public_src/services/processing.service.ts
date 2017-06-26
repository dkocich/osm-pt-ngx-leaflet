import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";

import {MapService} from "./map.service";
import {StorageService} from "./storage.service";
import {LoadingService} from "./loading.service";

import {IPtStop} from "../core/ptStop.interface";
import {IPtRelation} from "../core/ptRelation.interface";

@Injectable()
export class ProcessingService {
    // Observable boolean sources
    private showRelationsForStopSource = new Subject<boolean>();
    private showStopsForRouteSource = new Subject<boolean>();
    private refreshSidebarViewsSource = new Subject<string>();
    // Observable boolean streams
    public showRelationsForStop$ = this.showRelationsForStopSource.asObservable();
    public showStopsForRoute$ = this.showStopsForRouteSource.asObservable();
    public refreshSidebarViews$ = this.refreshSidebarViewsSource.asObservable();

    constructor(private storageService: StorageService,
                private mapService: MapService,
                private loadingService: LoadingService) {

        this.mapService.popupBtnClick.subscribe(
            (data) => {
                console.log(data);
                let featureType = data[0];
                let featureId = Number(data[1]);
                let element = this.findElementById(featureId, featureType);
                if (!element) {
                    alert("Element was not found?!");
                } else if (featureType === "node") {
                    this.exploreStop(element);
                } else if (featureType === "relation") {
                    this.exploreRelation(element);
                }
            }
        );
    }

    /**
     * Returns element with specific ID.
     * @param featureId
     * @param featureType
     * @returns {IPtStop}
     */
    private findElementById(featureId: number, featureType?: string): object {
        for (let element of this.storageService.listOfStops) {
            console.log(element.id, featureId);
            if (element.id === featureId) {
                console.log(element);
                return element;
            }
        }
    }

    /**
     * Filters data in the sidebar depending on current view's bounding box.
     */
    public filterDataInBounds(): void {
        if (!this.storageService.localJsonStorage) return;
        this.mapService.bounds = this.mapService.map.getBounds();
        for (let stop of this.storageService.listOfStops) {
            let el = document.getElementById(stop.id.toString());
            if (!el) return;
            if (el && this.mapService.bounds.contains([stop.lat, stop.lon])) {
                el.style.display = "table-row";
            } else {
                el.style.display = "none";
            }
        }
    }

    /**
     *
     * @param response
     */
    public processResponse(response: object): void {
        console.log(response);
        let transformedGeojson = this.mapService.osmtogeojson(response);
        this.storageService.localJsonStorage = response;
        this.storageService.localGeojsonStorage = transformedGeojson;
        this.createLists();
        this.mapService.renderTransformedGeojsonData(transformedGeojson);
        this.loadingService.hide();
    }

    /**
     * Creates initial list of stops/relations.
     */
    public createLists(): void {
        this.storageService.localJsonStorage.elements.forEach( (element) => {
            switch (element.type) {
                case "node":
                    if (element.tags && element.tags.bus === "yes") {
                        this.storageService.listOfStops.push(element);
                    }
                    break;
                case "relation":
                    if (element.tags.public_transport === "stop_area") {
                        this.storageService.listOfMasters.push(element);
                    } else {
                        this.storageService.listOfRelations.push(element);
                        break;
                    }
            }
        });
        console.log(
            "Total # of nodes: ", this.storageService.listOfStops.length,
            "Total # of relations: ", this.storageService.listOfRelations.length,
            "Total # of master rel. ", this.storageService.listOfMasters.length);
    }

    /**
     *
     * @param data
     */
    public activateFilteredRouteView(data: boolean): void {
        this.showRelationsForStopSource.next(data);
    }

    /**
     *
     * @param data
     */
    public activateFilteredStopView(data: boolean): void  {
        this.showStopsForRouteSource.next(data);
    }

    /**
     *
     * @param data
     */
    private refreshSidebarView(data: string): void  {
        this.refreshSidebarViewsSource.next(data);
    }

    /**
     *
     * @param element
     */
    private refreshTagView(element): void  {
        this.storageService.currentElement = element;
        this.refreshSidebarView("tag");
    }

    /**
     *
     * @param rel
     */
    public exploreRelation(rel: any): void  {
        if (this.mapService.highlightIsActive()) this.mapService.clearHighlight();
        this.storageService.clearRouteData();
        if (this.mapService.showRoute(rel)) {
            this.mapService.drawTooltipFromTo(rel);
            this.filterStopsByRelation(rel);
            this.mapService.map.fitBounds(this.mapService.highlightStroke.getBounds());
        }
        this.refreshTagView(rel.tags);
    }

    /**
     *
     * @param stop
     */
    public exploreStop(stop: any): void {
        if (this.mapService.highlightIsActive()) this.mapService.clearHighlight();
        this.mapService.showStop(stop);
        let filteredRelationsForStop = this.filterRelationsByStop(stop);
        this.mapService.showRelatedRoutes(filteredRelationsForStop);
        this.refreshTagView(stop.tags);
        this.mapService.map.panTo([stop.lat, stop.lon]);
    }

    /**
     * Filters relations (routes) for given stop.
     * @param stop
     */
    public filterRelationsByStop(stop: IPtStop): object[] {
        this.storageService.listOfRelationsForStop = [];

        for (let relation of this.storageService.listOfRelations) {
            for (let member of relation["members"]) {
                if (member["ref"] === stop.id) {
                    this.storageService.listOfRelationsForStop.push(relation);
                }
            }
        }
        this.activateFilteredRouteView(true);
        this.refreshSidebarView("route");
        return this.storageService.listOfRelationsForStop;
    }

    /**
     * Filters stops for given relation (route).
     * @param rel
     */
    public filterStopsByRelation(rel: IPtRelation): void {
        this.storageService.listOfStopsForRoute = rel.members;
        this.activateFilteredStopView(true);
        this.refreshSidebarView("stop");
    }
}

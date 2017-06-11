import {Injectable} from "@angular/core";
import {StorageService} from "./storage.service";
import {Subject} from "rxjs/Subject";
import {IPtStop} from "../core/ptStop.interface";
import {IPtRelation} from "../core/ptRelation.interface";
import {MapService} from "./map.service";

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
                private mapService: MapService) { }

    public processResponse(response) {
        console.log(response);
        let transformedGeojson = this.mapService.osmtogeojson(response);
        this.storageService.localJsonStorage = response;
        this.storageService.localGeojsonStorage = transformedGeojson;
        this.createLists();
        this.mapService.renderTransformedGeojsonData(transformedGeojson);
    }

    public createLists() {
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

    // Service message commands
    public activateFilteredRouteView(data: boolean) {
        this.showRelationsForStopSource.next(data);
    }

    public activateFilteredStopView(data: boolean) {
        this.showStopsForRouteSource.next(data);
    }

    private refreshSidebarView(data: string) {
        this.refreshSidebarViewsSource.next(data);
    }

    private refreshTagView(element) {
        this.storageService.currentElement = element;
        this.refreshSidebarView("tag");
    }

    public exploreRelation(rel) {
        if (this.mapService.highlightIsActive()) this.mapService.clearHighlight();
        this.storageService.clearRouteData();
        if (this.mapService.showRoute(rel)) {
            this.mapService.drawTooltipFromTo(rel);
            this.filterStopsByRelation(rel);
            this.refreshTagView(rel.tags);
            this.mapService.map.fitBounds(this.mapService.highlightStroke.getBounds());
        }
    }

    public exploreStop(stop) {
        if (this.mapService.highlightIsActive()) this.mapService.clearHighlight();
        this.filterRelationsByStop(stop);
        this.refreshTagView(stop.tags);
        this.mapService.map.panTo([stop.lat, stop.lon]);
    }
    /**
     *
     * @param stop
     * {
     *    "type": "node",
     *    "id": 447767772,
     *    "lat": 49.6769377,
     *    "lon": 18.3665044,
     *    "timestamp": "2017-04-20T01:22:48Z",
     *    "version": 3,
     *    "changeset": 47956115,
     *    "user": "dkocich",
     *    "uid": 1784758,
     *    "tags": {
     *      "bench": "yes",
     *      "bus": "yes",
     *      "name": "Frýdek-Místek, Frýdek, U Gustlíčka",
     *      "public_transport": "platform",
     *      "shelter": "yes"
     *    }
     *  }
     */
    public filterRelationsByStop(stop: IPtStop): void {
        this.storageService.listOfRelationsForStop = [];

        for (let relation of this.storageService.listOfRelations) {
            for (let member of relation["members"]) {
                if (member["ref"] === stop.id) {
                    console.log(relation);
                    this.storageService.listOfRelationsForStop.push(relation);
                }
            }
        }
        console.log(this.storageService.listOfRelationsForStop);
        this.activateFilteredRouteView(true);
        this.refreshSidebarView("route");
    }

    /**
     *
     * @param rel
     *  {
     *    "type": "relation",
     *    "id": 7157492,
     *    "timestamp": "2017-05-15T22:23:20Z",
     *    "version": 5,
     *    "changeset": 48714598,
     *    "user": "dkocich",
     *    "uid": 1784758,
     *    "members": [
     *      {
     *        "type": "node",
     *        "ref": 2184049214,
     *        "role": "stop"
     *      },
     *      {
     *        "type": "node",
     *        "ref": 2162278060,
     *        "role": "platform"
     *      },
     *      {
     *        "type": "way",
     *        "ref": 387730713,
     *        "role": ""
     *      }
     *    ],
     *    "tags": {
     *      "complete": "no",
     *      "from": "Řepiště, U kříže",
     *      "name": "Bus 11: Řepiště, U kříže -> Místek,Riviéra",
     *      "operator": "ČSAD Frýdek-Místek",
     *      "public_transport:version": "2",
     *      "route": "bus",
     *      "to": "Místek,Riviéra",
     *      "type": "route"
     *    }
     *  }
     */
    public filterStopsByRelation(rel: IPtRelation): void {
        this.storageService.listOfStopsForRoute = rel.members;
        this.activateFilteredStopView(true);
        this.refreshSidebarView("stop");
    }
}

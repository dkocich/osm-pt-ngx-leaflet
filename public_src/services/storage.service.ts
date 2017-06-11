import {Injectable} from "@angular/core";
import {IPtStop} from "../core/ptStop.interface";

@Injectable()
export class StorageService {
    public localJsonStorage: any;
    public localGeojsonStorage: object;
    public listOfStops: IPtStop[] = [];
    public listOfRelations: object[] = [];
    public listOfMasters: object[] = [];

    // filtering of sidebar
    public listOfStopsForRoute: object[] = [];
    public listOfRelationsForStop: object[] = [];

    public stopsForRoute: object[] = [];
    public platformsForRoute: object[] = [];
    public waysForRoute: object[] = [];
    public relationsForRoute: object[] = [];
    public currentElement: object = {};

    public displayName: string = "";

    public clearRouteData() {
        this.stopsForRoute = [];
        this.platformsForRoute = [];
        this.waysForRoute = [];
        this.relationsForRoute = [];
    }

    constructor() { }

    public setUserData(displayName, id, count): void {
        this.displayName = displayName;
        localStorage.setItem("display_name", displayName);
        localStorage.setItem("id", id);
        localStorage.setItem("count", count);
    }

    public clearLocalStorage(): void {
        localStorage.clear();
    }

    public getDisplayName(): string {
        return this.displayName || localStorage.getItem("display_name");
    }
}

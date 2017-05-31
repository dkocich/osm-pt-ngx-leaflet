import {Injectable} from "@angular/core";

@Injectable()
export class StorageService {
    public localJsonStorage: any;
    public localGeojsonStorage: any;
    public listOfStops: any = [];
    public listOfRelations: any = [];

    // filtering of sidebar
    public listOfStopsForRoute: object[] = [];
    public listOfRelationsForStop: object[] = [];

    public stopsForRoute: object[] = [];
    public platformsForRoute: object[] = [];
    public waysForRoute: object[] = [];
    public relationsForRoute: object[] = [];

    public clearRouteData() {
        this.stopsForRoute = [];
        this.platformsForRoute = [];
        this.waysForRoute = [];
        this.relationsForRoute = [];
    }

    constructor() { }
}

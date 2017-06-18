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

    public setSessionStorageItem(key: string, value: any): void {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    public getSessionStorageItem(key: string): any{
        let item = sessionStorage.getItem(key);
        return JSON.parse(item);
    }

    public pushToSessionStorageItem(key, value): void {
        let previousValue = sessionStorage.getItem(key);
        sessionStorage.setItem(key, JSON.stringify(previousValue + value));
    }

    public setLocalStorageItem(key: string, value: any): void {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    public getLocalStorageItem(key: string): any {
        let item = sessionStorage.getItem(key);
        return JSON.parse(item);
    }

    public pushToLocalStorageItem(key, value): void {
        let previousValue = localStorage.getItem(key);
        localStorage.setItem(key, JSON.stringify(previousValue + value));
    }

    public clearLocalStorage(): void {
        localStorage.clear();
    }

    public clearSessionStorage(): void {
        sessionStorage.clear();
    }

    public getDisplayName(): string {
        return this.displayName || localStorage.getItem("display_name");
    }
}

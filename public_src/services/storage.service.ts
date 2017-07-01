import {Injectable} from "@angular/core";

import {IPtStop} from "../core/ptStop.interface";

@Injectable()
export class StorageService {
    public idsSet = new Set();
    public elementsMap = new Map();

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

    public clearRouteData(): void {
        this.stopsForRoute = [];
        this.platformsForRoute = [];
        this.waysForRoute = [];
        this.relationsForRoute = [];
    }

    constructor() { }

    /**
     * Sets user details after login.
     * @param displayName
     * @param id
     * @param count
     */
    public setUserData(displayName: string, id: string, count: string): void {
        this.displayName = displayName;
        localStorage.setItem("display_name", displayName);
        localStorage.setItem("id", id);
        localStorage.setItem("count", count);
    }

    /**
     * Sets an object from a localStorage for a specific key.
     * @param key
     * @param value
     */
    public setSessionStorageItem(key: string, value: any): void {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Retrieves an object from a sessionStorage for a specific key.
     * @param key
     * @returns {any}
     */
    public getSessionStorageItem(key: string): any {
        let item: any = sessionStorage.getItem(key);
        return JSON.parse(item);
    }

    /**
     * Pushes key's object to the sessionStorage.
     * @param key
     * @param value
     */
    public pushToSessionStorageItem(key: string, value: object): void {
        let previousValue: any = sessionStorage.getItem(key);
        sessionStorage.setItem(key, JSON.stringify(previousValue + value));
    }

    /**
     * Sets an object from a localStorage for a specific key.
     * @param key
     * @param value
     */
    public setLocalStorageItem(key: string, value: any): void {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Retrieves an object from a localStorage for a specific key.
     * @param key
     * @returns {any}
     */
    public getLocalStorageItem(key: string): any {
        let item = sessionStorage.getItem(key);
        return JSON.parse(item);
    }

    /**
     * Pushes key's object to the localStorage.
     * @param key
     * @param value
     */
    public pushToLocalStorageItem(key: string, value: object): void {
        let previousValue: string = localStorage.getItem(key);
        localStorage.setItem(key, JSON.stringify(previousValue + value));
    }

    /**
     * Clears LocalStorage completely.
     */
    public clearLocalStorage(): void {
        localStorage.clear();
    }

    /**
     * Clears SessionStorage completely.
     */
    public clearSessionStorage(): void {
        sessionStorage.clear();
    }

    /**
     * Retrieves name of currently logged user.
     * @returns {string|null}
     */
    public getDisplayName(): string {
        return this.displayName || localStorage.getItem("display_name");
    }
}

import {EventEmitter, Injectable} from "@angular/core";

import {OsmEntity} from "../core/osmEntity.interface";
import {IPtStop} from "../core/ptStop.interface";

@Injectable()
export class StorageService {
    public idsSet = new Set();
    public elementsMap = new Map();

    public localJsonStorage: any;
    public localGeojsonStorage: object;
    public listOfStops: IPtStop[] = [];
    public listOfRelations: object[] = [];
    public listOfAreas: object[] = [];
    public listOfMasters: object[] = [];
    public listOfVariants: object[] = [];

    // filtering of sidebar
    public listOfStopsForRoute: object[] = [];
    public listOfRelationsForStop: object[] = [];

    public stopsForRoute: object[] = [];
    public platformsForRoute: object[] = [];
    public waysForRoute: object[] = [];
    public relationsForRoute: object[] = [];
    public currentElement: OsmEntity;
    public currentElementsChange = new EventEmitter();

    public displayName: string = "";

    public edits: object[] = [];
    public editsChanged: EventEmitter<boolean> = new EventEmitter();
    public stats: EventEmitter<object> = new EventEmitter();

    public clearRouteData(): void {
        this.stopsForRoute = [];
        this.platformsForRoute = [];
        this.waysForRoute = [];
        this.relationsForRoute = [];
    }

    constructor() {
        this.currentElementsChange.subscribe(
            (data) => {
                this.currentElement = data;
            }
        );
    }

    /**
     * Logs basic data statistics.
     */
    public logStats() {
        let stats = {
            "s": this.listOfStops.length,
            "r": this.listOfRelations.length,
            "a": this.listOfAreas.length,
            "m": this.listOfMasters.length
        };
        this.stats.emit(stats);
    }

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
     * Synchronizes localStorage edits content with current memory object array.
     */
    public syncEdits() {
        localStorage.setItem("edits", JSON.stringify(this.edits));
        this.editsChanged.emit(true);
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
        return JSON.parse(sessionStorage.getItem(key));
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
        return JSON.parse(localStorage.getItem(key));
    }

    /**
     * Pushes key's object to the localStorage.
     * @param key
     * @param value
     */
    public pushToLocalStorageItem(key: string, value: object): void {
        let previousValue: string = localStorage.getItem(key);
        if (!previousValue) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            let previousObj: object[] = JSON.parse(previousValue);
            previousObj.push(value);
            localStorage.setItem(key, JSON.stringify(previousObj));
        }
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
     * @returns {string|string|null}
     */
    public getDisplayName(): string {
        return this.displayName || localStorage.getItem("display_name");
    }

    // /**
    //  * Overwrites last step in the history of edits.
    //  * @param key
    //  * @param value
    //  */
    // public overwriteLastLocalStorageEdit(key: string, value: object): void {
    //     let edits: any = JSON.parse(localStorage.getItem(key));
    //     edits[edits.length - 1] = value;
    //     localStorage.setItem(key, JSON.stringify(edits));
    // }
    //
    // /**
    //  *
    //  */
    // private countUniqueEdits(): any {
    //     let idsArray = [];
    //     // let arr =  this.edits;
    //     //
    //     // let counts = {};
    //     // for (let i = 0; i < arr.length; i++) {
    //     //     counts[arr[i]["id"]] = 1 + (counts[arr[i]["id"]] || 0);
    //     // }
    //
    //     for (let edit of this.edits) {
    //         if (!idsArray) {
    //             idsArray.push(edit["id"]);
    //         } else {
    //
    //         }
    //     }
    //     return idsArray.length;
    // }
}

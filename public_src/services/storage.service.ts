import { EventEmitter, Injectable } from '@angular/core';

import { IPtStop } from '../core/ptStop.interface';
import { IOsmElement } from '../core/osmElement.interface';
import { INameErrorObject, IPTvErrorObject, IRefErrorObject, IWayErrorObject } from '../core/errorObject.interface';

@Injectable()
export class StorageService {
  public elementsDownloaded = new Set();
  public queriedMasters = new Set();
  public elementsRendered = new Set();
  public elementsMap = new Map();
  public markersMap = new Map();
  public elementsToHighlight = new Set();

  public localJsonStorage: any = new Map();
  public localGeojsonStorage: any = new Map();
  public listOfStops: IPtStop[] = [];
  public listOfRelations: object[] = [];
  public listOfAreas: object[] = [];
  public listOfMasters: object[] = [];
  public listOfVariants: object[] = [];

  // filtering of sidebar
  public listOfStopsForRoute: IPtStop[] = [];
  public listOfRelationsForStop: object[] = [];

  public stopsForRoute: number[] = [];
  public platformsForRoute: number[] = [];
  public waysForRoute: number[] = [];
  public relationsForRoute: number[] = [];

  public idsHaveMaster = new Set();

  public currentElement: IOsmElement | undefined;
  public currentElementsChange = new EventEmitter();
  public selectedStopBeginnerMode: IOsmElement | undefined;

  public displayName: string = '';
  public imgHref: string = '';

  public edits: object[] = [];
  public editsChanged: EventEmitter<boolean> = new EventEmitter();
  public stats: EventEmitter<object> = new EventEmitter();
  public tempStepAdded: EventEmitter<boolean>      = new EventEmitter();
  public tutorialStepCompleted: EventEmitter<boolean> = new EventEmitter();

  public completelyDownloadedRoutesIDB    = new Set();
  public completelyDownloadedStopsIDB     = new Set();
  public completelyDownloadedPlatformsIDB = new Set();
  public queriedRoutesForMastersIDB       = new Set();

  public nameErrorsObj: INameErrorObject[] = [];
  public refErrorsObj: IRefErrorObject[]   = [];
  public wayErrorsObj: IWayErrorObject[]   = [];
  public PTvErrorsObj: IPTvErrorObject[]   = [];

  public currentIndex                            = 0;
  public refreshErrorObjects: EventEmitter<object> = new EventEmitter();

  constructor() {
    this.currentElementsChange.subscribe((data) => {
      this.currentElement = data;
    });
  }

  /**
   * Logs basic data statistics.
   */
  public logStats(): void {
    console.log(
      'LOG (storage)',
      'Total # of nodes: ',
      this.listOfStops.length,
      'Total # of relations: ',
      this.listOfRelations.length,
      'Total # of master rel. (stop areas only): ',
      this.listOfAreas.length,
      'Total # of master rel. (master rel.): ',
      this.listOfMasters.length,
      'elDownloaded: ',
      this.elementsDownloaded.size,
      'elRendered: ',
      this.elementsRendered.size,
      'elMap: ',
      this.elementsMap.size,
      'queriedM: ',
      this.queriedMasters.size,
    );
    const stats = {
      a: this.listOfAreas.length,
      m: this.listOfMasters.length,
      r: this.listOfRelations.length,
      s: this.listOfStops.length,
    };
    this.stats.emit(stats);
  }

  public clearRouteData(): void {
    this.stopsForRoute = [];
    this.platformsForRoute = [];
    this.waysForRoute = [];
    this.relationsForRoute = [];
  }

  /**
   * Sets user details after login.
   * @param userDetails
   */
  public setUserData(userDetails: any): void {
    console.log(userDetails);
    this.displayName = userDetails.displayName;
    this.imgHref = userDetails.img_href;
    localStorage.setItem('account_created', userDetails.account_created);
    localStorage.setItem('count', userDetails.count);
    localStorage.setItem('description', userDetails.description);
    localStorage.setItem('display_name', userDetails.display_name);
    localStorage.setItem('id', userDetails.id);
    localStorage.setItem('img_href', userDetails.img_href);
  }

  /**
   * Synchronizes localStorage edits content with current memory object array.
   */
  public syncEdits(): void {
    localStorage.setItem('edits', JSON.stringify(this.edits));
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
    const previousValue: any = sessionStorage.getItem(key);
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
    const previousValue: string = localStorage.getItem(key);
    if (!previousValue) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      const previousObj: object[] = JSON.parse(previousValue);
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
    return localStorage.getItem('display_name');
  }

  /**
   * Retrieves imgHref of currently logged user.
   * @returns {string}
   */
  public getImgHref(): string {
    return localStorage.getItem('img_href');
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

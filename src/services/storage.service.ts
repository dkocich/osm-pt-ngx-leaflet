import { EventEmitter, Injectable } from '@angular/core';
import {
  INameErrorObject,
  IPTPairErrorObject,
  IPTvErrorObject,
  IRefErrorObject,
  IWayErrorObject,
} from '../core/errorObject.interface';
import { IOsmElement } from '../core/osmElement.interface';
import { IPtStop } from '../core/ptStop.interface';

@Injectable()
export class StorageService {
  elementsDownloaded = new Set();
  queriedMasters = new Set();
  elementsRendered = new Set();
  elementsMap = new Map();
  markersMap = new Map();
  elementsToHighlight = new Set();

  localJsonStorage = new Map();
  localGeojsonStorage = new Map();
  listOfStops: IPtStop[] = [];
  listOfRelations: object[] = [];
  listOfAreas: object[] = [];
  listOfMasters: object[] = [];
  listOfVariants: object[] = [];

  // filtering of sidebar
  listOfStopsForRoute: IPtStop[] = [];
  listOfRelationsForStop: object[] = [];

  stopsForRoute: number[] = [];
  platformsForRoute: number[] = [];
  waysForRoute: number[] = [];
  relationsForRoute: number[] = [];

  idsHaveMaster = new Set();

  currentElement: IOsmElement | undefined;
  currentElementsChange = new EventEmitter();
  selectedStopBeginnerMode: IOsmElement | undefined;

  displayName = '';
  imgHref = '';

  edits: object[] = [];
  editsChanged: EventEmitter<boolean> = new EventEmitter();
  stats: EventEmitter<object> = new EventEmitter();

  tempStepAdded: EventEmitter<boolean> = new EventEmitter();
  tutorialStepCompleted: EventEmitter<string> = new EventEmitter();
  currentTutorial = null;
  currentTutorialStep = 0;
  // checkComplete: EventEmitter<boolean> = new EventEmitter();

  completelyDownloadedRoutesIDB = new Set();
  completelyDownloadedStopsIDB = new Set();
  completelyDownloadedPlatformsIDB = new Set();
  queriedRoutesForMastersIDB = new Set();

  nameErrorsObj: INameErrorObject[] = [];
  refErrorsObj: IRefErrorObject[] = [];
  wayErrorsObj: IWayErrorObject[] = [];
  PTvErrorsObj: IPTvErrorObject[] = [];
  ptPairErrorsObject: IPTPairErrorObject[] = [];

  currentIndex = 0;
  refreshErrorObjects: EventEmitter<object> = new EventEmitter();

  constructor() {
    this.currentElementsChange.subscribe((data) => {
      this.currentElement = data;
    });
  }

  /**
   * Logs basic data statistics.
   */
  logStats(): void {
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
      this.queriedMasters.size
    );
    const stats = {
      a: this.listOfAreas.length,
      m: this.listOfMasters.length,
      r: this.listOfRelations.length,
      s: this.listOfStops.length,
    };
    this.stats.emit(stats);
  }

  clearRouteData(): void {
    this.stopsForRoute = [];
    this.platformsForRoute = [];
    this.waysForRoute = [];
    this.relationsForRoute = [];
  }

  /**
   * Sets user details after login.
   */
  setUserData(userDetails): void {
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
  syncEdits(): void {
    localStorage.setItem('edits', JSON.stringify(this.edits));
    this.editsChanged.emit(true);
  }

  /**
   * Sets an object from a localStorage for a specific key.
   */
  setSessionStorageItem(key: string, value): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieves an object from a sessionStorage for a specific key.
   */
  getSessionStorageItem(key: string) {
    return JSON.parse(sessionStorage.getItem(key));
  }

  /**
   * Pushes key's object to the sessionStorage.
   */
  pushToSessionStorageItem(key: string, value: object): void {
    const previousValue = sessionStorage.getItem(key);
    sessionStorage.setItem(key, JSON.stringify(previousValue + value));
  }

  /**
   * Sets an object from a localStorage for a specific key.
   */
  setLocalStorageItem(key: string, value): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieves an object from a localStorage for a specific key.
   */
  getLocalStorageItem(key: string) {
    return JSON.parse(localStorage.getItem(key));
  }

  /**
   * Pushes key's object to the localStorage.
   */
  pushToLocalStorageItem(key: string, value: object): void {
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
  clearLocalStorage(): void {
    localStorage.clear();
  }

  /**
   * Clears SessionStorage completely.
   */
  clearSessionStorage(): void {
    sessionStorage.clear();
  }

  /**
   * Retrieves name of currently logged user.
   */
  getDisplayName(): string {
    return localStorage.getItem('display_name');
  }

  /**
   * Retrieves imgHref of currently logged user.
   */
  getImgHref(): string {
    return localStorage.getItem('img_href');
  }

  // /**
  //  * Overwrites last step in the history of edits.
  //  */
  // overwriteLastLocalStorageEdit(key: string, value: object): void {
  //     let edits = JSON.parse(localStorage.getItem(key));
  //     edits[edits.length - 1] = value;
  //     localStorage.setItem(key, JSON.stringify(edits));
  // }
  //
  // /**
  //  *
  //  */
  // private countUniqueEdits() {
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

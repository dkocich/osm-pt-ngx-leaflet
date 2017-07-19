import { EventEmitter, Injectable } from "@angular/core";

import { MapService } from "./map.service";
import { ProcessingService } from "./processing.service";
import { StorageService } from "./storage.service";

import { IOsmEntity } from "../core/osmEntity.interface";

@Injectable()
export class EditingService {
    public editingMode: EventEmitter<boolean> = new EventEmitter(false);
    public currentEditStep: number;
    public totalEditSteps: number;
    public currentTotalSteps: EventEmitter<object> = new EventEmitter();
    public elementChanges: any = [];

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private mapService: MapService) {

        // local events
        this.currentTotalSteps.subscribe(
            /**
             * @param data - f. e. {"current": 5, "total": 10}
             */
            (data) => {
                this.currentEditStep = data.current;
                this.totalEditSteps = data.total;
            }
        );

        // MapService events
        this.mapService.markerEdit.subscribe(
            /**
             * @param data - {"featureId": , "type": "change marker position",
             * "change": {"from": {"lat": ..., "lng": ... }, "to": {"lat": ..., "lng": ... } } }
             */
            (data) => {
                const element = this.processingService.findElementById(Number(data.featureId));
                this.addChange(element, data.type, data.change);
            }
        );
    }

    /**
     * Handles reapplying of unsaved edits after the page was reloaded.
     */
    public continueEditing(): void {
        this.storageService.edits = JSON.parse(localStorage.getItem("edits"));
        this.updateCounter();
        // TODO add logic to apply all already created changes
        if (this.storageService.localJsonStorage) {
            alert("TODO: Data are loaded - edits should be applied right now.");
        } else {
            alert("TODO: There are no loaded data - can't apply saved edits to map now.");
        }
    }

    /**
     * Checks if the last edit was made on the same tag like the new change.
     * @param change
     * @returns {boolean}
     */
    private shouldCombineChanges(change) {
        const last = this.storageService.edits[this.storageService.edits.length - 1];
        return last["change"].to.key === change.from.key && last["change"].to.value === change.from.value;
    }

    /**
     * Checks if last two changes are on the same tag and combines them in edit. history together.
     * @param editObj
     */
    private combineChanges(editObj) {
        console.log("LOG (editing s.) Combining changes");
        const last = this.storageService.edits[this.storageService.edits.length - 1];
        last["change"].to.key = editObj.change.to.key;
        last["change"].to.value = editObj.change.to.value;
        this.storageService.edits[this.storageService.edits.length - 1] = last;
    }

    /**
     * Handles the complete process of adding a change to the history.
     * @param element - changed entity
     * @param type - some comment about a created change
     * @param change - change object
     */
    public addChange(element: any, type: string, change: object): any {
        const edits: object[] = this.storageService.edits;
        const editObj: any = {
            "change": change,
            "id": element.id,
            "type": type
        };
        if (this.isBrowsingHistoryOfChanges()) {
            this.deleteMoreRecentChanges(this.currentEditStep);
        }

        if (type === "change tag" && this.storageService.edits.length && this.shouldCombineChanges(change)) {
            this.combineChanges(editObj);
        } else {
            this.storageService.edits.push(editObj);
        }

        switch (editObj.type) {
            case "add tag":
                console.log("LOG (editing s.) Should add this tag: ", editObj);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === editObj.id) {
                        elem.tags[editObj.change.key] = editObj.change.value;
                        console.log("LOG (editing s.) Added element: ", elem);
                    }
                });
                break;
            case "remove tag":
                console.log("LOG (editing s.) Should remove this tag: ", editObj);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === editObj.id) {
                        delete elem.tags[editObj.change.key];
                        console.log("LOG (editing s.) Removed element: ", elem);
                    }
                });
                break;
            case "change tag":
                console.log("LOG (editing s.) I should make this change: ", editObj);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === editObj.id) {
                        delete elem.tags[editObj.change.from.key];
                        elem.tags[editObj.change.to.key] = editObj.change.to.value;
                        console.log("LOG (editing s.) Changed element: ", elem);
                    }
                });
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(editObj));
        }
        this.processingService.refreshTagView(element);
        this.storageService.syncEdits();
        this.updateCounter();
    }

    /**
     * Emits numbers which are visible in toolbar counter while editing.
     */
    private updateCounter(): void {
        this.currentEditStep = this.totalEditSteps = this.storageService.edits.length;
        this.currentTotalSteps.emit({ "current": this.currentEditStep, "total": this.totalEditSteps });
    }

    /**
     * Handles adding of different PT elements and fills attributes automatically.
     * @param type
     */
    public createNewElement (type: string): void {
        // TODO fill attributes, focus tag editor on element, continue editing

        let newElement: IOsmEntity;
        switch (type) {
            case "stop":
                newElement.tags = {
                    "name": "",
                    "public_transport": "stop_position"
                };
                break;
            case "platform":
                newElement.tags = {
                    "name": "",
                    "public_transport": "platform"
                };
                break;
            default:
                console.log("LOG (editing s.) Type was created: ", type);
        }
    }

    /**
     * Checks if user browses history of edits.
     * @returns {boolean}
     */
    private isBrowsingHistoryOfChanges(): boolean {
        return this.currentEditStep < this.storageService.edits.length;
    }

    /**
     * Deletes all more recent edits if an user makes some change while browsing in history.
     * @param fromChangeNumber
     */
    private deleteMoreRecentChanges(fromChangeNumber: number): void {
        this.storageService.edits.length = fromChangeNumber;
    }

    /**
     * Applies current step of edit.
     * @param edit - edit object
     */
    private applyChange(edit: any): void {
        if (!edit.id) {
            alert(edit);
        }
        const element = this.processingService.findElementById(edit["id"]);
        this.processingService.zoomToElement(element);
        switch (edit.type) {
            case "add tag":
                console.log("LOG (editing s.) Should add tag: ", edit);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === edit.id) {
                        elem.tags[edit.change.key] = edit.change.value;
                        console.log("LOG (editing s.) Added again", elem);
                        this.processingService.refreshTagView(elem);
                    }
                });
                break;
            case "remove tag":
                console.log("LOG (editing s.) Should remove tag: ", edit);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === edit.id) {
                        delete elem.tags[edit.change.key];
                        console.log("LOG (editing s.) Removed again", elem);
                        this.processingService.refreshTagView(elem);
                    }
                });
                break;
            case "change tag":
                console.log("LOG (editing s.) Should reapply this changed tag: ", edit);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === edit.id) {
                        delete element.tags[edit.change.from.key];
                        elem.tags[edit.change.to.key] = edit.change.to.value;
                        console.log("LOG (editing s.) Changed again", elem);
                        this.processingService.refreshTagView(elem);
                    }
                });
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(edit));
        }
    }

    /**
     * Undoes/deletes current step of edit.
     * @param edit - edit object
     */
    private undoChange(edit: any): void {
        const element = this.processingService.findElementById(edit["id"]);
        this.processingService.zoomToElement(element);

        switch (edit.type) {
            case "add tag":
                console.log("LOG (editing s.) Should remove this added tag: ", edit);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === edit.id) {
                        delete elem.tags[edit.change.key];
                        console.log("LOG (editing s.) Removed again", elem);
                        this.processingService.refreshTagView(elem);
                    }
                });
                break;
            case "remove tag":
                console.log("LOG (editing s.) Should add this removed tag: ", edit);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === edit.id) {
                        elem.tags[edit.change.key] = edit.change.value;
                        console.log("LOG (editing s.) Added again", elem);
                        this.processingService.refreshTagView(elem);
                    }
                });
                break;
            case "change tag":
                console.log("LOG (editing s.) Should undo this changed tag: ", edit);
                this.storageService.localJsonStorage.elements.forEach( (elem) => {
                    if (elem.id === edit.id) {
                        delete elem.tags[edit.change.to.key];
                        elem.tags[edit.change.from.key] = edit.change.from.value;
                        console.log("LOG (editing s.) Changed again", elem);
                        this.processingService.refreshTagView(elem);
                    }
                });
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(edit));
        }
    }

    /**
     * Handles switching between edits (undoing/applying changes, map move)
     * @param direction - "forward" or "backward"
     */
    public step(direction: string) {
        // TODO
        if (direction === "forward") {
            const edit = this.storageService.edits[this.currentEditStep - 1];
            console.log("LOG (editing s.) Moving forward in history");
            this.applyChange(edit);
        } else if (direction === "backward") {
            const edit = this.storageService.edits[this.currentEditStep];
            console.log("LOG (editing s.) Moving backward in history");
            this.undoChange(edit);
        }
    }
}

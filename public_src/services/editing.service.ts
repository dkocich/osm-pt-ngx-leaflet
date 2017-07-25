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
                const element = this.processingService.getElementById(Number(data.featureId));
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

        if (type === "change members") {
            if (this.changeIsEqual(editObj)) {
                return alert("FIXME: problem - change is same as previous edit in the history");
            }
            this.simplifyMembers(editObj);
        }

        if (["change tag", "change members"].indexOf(type) > -1 &&
            this.storageService.edits.length && this.shouldCombineChanges(editObj)) {
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
            case "change members":
                console.log("LOG: I should change members", editObj);
                let currObj = this.storageService.elementsMap.get(editObj.id);
                currObj.members = editObj.change.to;
                this.storageService.elementsMap.set(editObj.id, currObj);
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(editObj));
        }
        if (["add tag", "remove tag", "change tag"].indexOf(type) > -1 ) {
            this.processingService.refreshTagView(element);
        } else if (type === "change members") {
            this.processingService.filterStopsByRelation(this.storageService.elementsMap.get(editObj.id));
            this.processingService.exploreRelation(this.storageService.elementsMap.get(editObj.id));
        }
        this.storageService.syncEdits();
        this.updateCounter();
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


    /**
     * @rel
     */
    public reorderMembers(rel) {
        if (!rel.members) {
            return alert(JSON.stringify(rel) + "FIXME please select relation");
        }

        const newOrder = [];
        rel["members"].forEach( (mem) => {
            if (["stop", "stop_exit_only", "stop_entry_only"].indexOf(mem["role"]) > -1) {
                newOrder.push(mem);
            }
        });
        rel["members"].forEach( (mem) => {
            if (["platform", "platform_exit_only", "platform_entry_only"].indexOf(mem["role"]) > -1) {
                newOrder.push(mem);
            }
        });
        rel["members"].forEach( (mem) => {
            if (["stop", "stop_exit_only", "stop_entry_only", "platform", "platform_exit_only",
                    "platform_entry_only"].indexOf(mem["role"]) === -1) {
                newOrder.push(mem);
            }
        });
        let change = {
            from: JSON.parse(JSON.stringify(rel.members)),
            to: JSON.parse(JSON.stringify(newOrder))
        };
        this.addChange(rel, "change members", change);
    }

    /**
     * Checks if the last edit was made on the same tag like the new change.
     * @param change
     * @returns {boolean}
     */
    private shouldCombineChanges(editObj) {
        const last = this.storageService.edits[this.storageService.edits.length - 1];
        switch (editObj.type) {
            case "change tags":
                return last["change"].to.key === editObj.change.from.key && last["change"].to.value === editObj.change.from.value;
            case "change members":
                return last["id"] === editObj.id;
        }
    }

    /**
     * Checks if last two changes are on the same tag and combines them in edit. history together.
     * @param editObj
     */
    private combineChanges(editObj) {
        console.log("LOG (editing s.) Combining changes");
        const last = this.storageService.edits[this.storageService.edits.length - 1];
        switch (editObj.type) {
            case "change tags":
                last["change"].to.key = editObj.change.to.key;
                last["change"].to.value = editObj.change.to.value;
                this.storageService.edits[this.storageService.edits.length - 1] = last;
                break;
            case "change members":
                last["change"].to = editObj.change.to;
                break;
        }
    }

    /**
     * Emits numbers which are visible in toolbar counter while editing.
     */
    private updateCounter(): void {
        this.currentEditStep = this.totalEditSteps = this.storageService.edits.length;
        this.currentTotalSteps.emit({ "current": this.currentEditStep, "total": this.totalEditSteps });
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
        const element = this.processingService.getElementById(edit["id"]);
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
            case "change members":
                console.log("LOG (editing s.) Should undo this change members", edit);
                let currObj = this.storageService.elementsMap.get(edit.id);
                currObj.members = edit.change.to;
                this.storageService.elementsMap.set(edit.id, currObj);
                this.processingService.filterStopsByRelation(this.storageService.elementsMap.get(edit.id));
                this.processingService.exploreRelation(this.storageService.elementsMap.get(edit.id));
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
        const element = this.processingService.getElementById(edit["id"]);
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
            case "change members":
                console.log("LOG (editing s.) Should undo this changed members", edit);
                let currObj = this.storageService.elementsMap.get(edit.id);
                delete currObj.members;
                currObj.members = edit.change.from;
                this.storageService.elementsMap.set(edit.id, currObj);
                // this.processingService.refreshSidebarView("stop");
                this.processingService.filterStopsByRelation(this.storageService.elementsMap.get(edit.id));
                this.processingService.exploreRelation(this.storageService.elementsMap.get(edit.id));
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(edit));
        }
    }

    private simplifyMembers(editObj) {
        for (const member of editObj.change.to) {
            for (const key of Object.keys(member)) {
                if (["type", "ref", "role"].indexOf(key) === -1) {
                    delete member[key];
                }
            }
        }
    }

    private changeIsEqual(editObj) {
        console.log(JSON.stringify(editObj.change.from).length, JSON.stringify(editObj.change.to).length);
        return JSON.stringify(editObj.change.from) === JSON.stringify(editObj.change.to);
    }
}

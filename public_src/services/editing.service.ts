import { EventEmitter, Injectable } from "@angular/core";

import { MapService } from "./map.service";
import { ProcessingService } from "./processing.service";
import { StorageService } from "./storage.service";

import { IPtStop } from "../core/ptStop.interface";

@Injectable()
export class EditingService {
    public editingMode: EventEmitter<boolean> = new EventEmitter(false);
    public currentEditStep: number;
    public totalEditSteps: number;
    public currentTotalSteps: EventEmitter<object> = new EventEmitter();
    public elementChanges: any = [];
    private editing: boolean;

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

        this.editingMode.subscribe(
            /**
             * @param data
             */
            (data) => {
                console.log("LOG (editing s.) Editing mode change in editingService- ", data);
                this.editing = data;
                this.storageService.markersMap.forEach( (marker) => {
                    if (this.editing === false) {
                        marker.dragging.disable();
                    } else if (this.editing === true) {
                        marker.dragging.enable();
                    }
                });
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
                const atElem = this.storageService.elementsMap.get(editObj.id);
                atElem.tags[editObj.change.key] = editObj.change.value;
                this.storageService.elementsMap.set(editObj.id, atElem);
                console.log("LOG (editing s.) Added element: ", atElem);
                break;
            case "remove tag":
                console.log("LOG (editing s.) Should remove this tag: ", editObj);
                const rtElem = this.storageService.elementsMap.get(editObj.id);
                delete rtElem.tags[editObj.change.key];
                this.storageService.elementsMap.set(editObj.id, rtElem);
                console.log("LOG (editing s.) Removed element: ", rtElem);
                break;
            case "change tag":
                console.log("LOG (editing s.) I should make this change: ", editObj);
                const chtElem = this.storageService.elementsMap.get(editObj.id);
                delete chtElem.tags[editObj.change.from.key];
                chtElem.tags[editObj.change.to.key] = editObj.change.to.value;
                this.storageService.elementsMap.set(editObj.id, chtElem);
                break;
            case "change members":
                console.log("LOG: I should change members", editObj);
                const chmElem = this.storageService.elementsMap.get(editObj.id);
                chmElem.members = editObj.change.to;
                this.storageService.elementsMap.set(editObj.id, chmElem);
                break;
            case "add element":
                console.log("LOG: I should add element", editObj);
                if (!this.storageService.elementsMap.get(editObj.id)) {
                    this.storageService.elementsMap.set(editObj.id, editObj.change.to);
                } else {
                    alert("FIXME: this new id already exist " +
                        JSON.stringify(this.storageService.elementsMap.get(editObj.id)));
                }
                this.processingService.refreshTagView(this.storageService.elementsMap.get(editObj.id));
                break;
            case "modify element":
                console.log("LOG: I should modify element", editObj);
                const modObj = this.storageService.elementsMap.get(editObj.id);
                modObj.lat = editObj.change.to.lat;
                modObj.lon = editObj.change.to.lon;
                this.storageService.elementsMap.set(editObj.id, modObj);
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(editObj));
        }
        if (["add tag", "remove tag", "change tag"].indexOf(type) > -1 ) {
            this.processingService.refreshTagView(element);
        } else if (type === "change members") {
            this.processingService.filterStopsByRelation(this.storageService.elementsMap.get(editObj.id));
            this.processingService.exploreRelation(this.storageService.elementsMap.get(editObj.id));
        } else if (type === "modify element") {
            // TODO?
        }
        this.storageService.syncEdits();
        this.updateCounter();
    }

    /**
     * Handles adding of different PT elements and fills attributes automatically.
     * @param type
     */
    public createElement (creatingElementOfType: string, event): void {
        let newId: number = this.findNewId();
        const marker = this.initializeNewMarker(creatingElementOfType, event, newId);
        this.createNewMarkerEvents(marker);
        this.storageService.markersMap.set(newId, marker);
        marker.addTo(this.mapService.map);
        const latlng = marker.getLatLng();
        let newElement: IPtStop = {
            changeset: -999,
            id: newId,
            lat: latlng.lat,
            lon: latlng.lng,
            tags: {},
            timestamp: new Date().toISOString().split(".")[0] + "Z",
            type: "node",
            uid: Number(localStorage.getItem("id")),
            user: localStorage.getItem("display_name"),
            version: 1
        };
        switch (creatingElementOfType) {
            case "stop":
                newElement.tags = {
                    name: "",
                    public_transport: "stop_position"
                };
                break;
            case "platform":
                newElement.tags = {
                    name: "",
                    public_transport: "platform"
                };
                break;
            default:
                console.log("LOG (editing s.) Type was created: ", creatingElementOfType);
        }
        let change = { from: undefined, to: newElement };
        this.addChange(newElement, "add element", change);
    }

    /**
     * Handles repositioning of newly created node elements.
     * @param marker
     * @param event
     */
    public repositionElement(marker, event) {
        const opt = event.target.options;
        const newPosition = event.target.getLatLng();
        let change = {
            from: {
                lat: opt.lat,
                lon: opt.lng
            },
            to: {
                lat: newPosition.lat,
                lon: newPosition.lng
            }
        };
        if (!this.storageService.elementsMap.has(opt.featureId)) {
            return alert("FIXME: missing storageService mapping for an element? " + opt.featureId);
        }
        // update position in marker's options
        const m = this.storageService.markersMap.get(opt.featureId);
        m.options.lat = newPosition.lat;
        m.options.lng = newPosition.lng;

        const element = this.storageService.elementsMap.get(opt.featureId);
        this.addChange(element, "modify element", change);
    }

    /**
     * Binds events to created markers.
     * @param marker
     */
    private createNewMarkerEvents(marker): void {
        marker.on("dragend", (event) => {
            this.repositionElement(marker, event);
        });
        marker.on("click", (event) => {
            const featureId = marker.options.featureId;
            this.mapService.markerClick.emit(featureId);
        });
    }

    /**
     * Creates new marker with unique ID, icon, options and metadata attributes.
     * @param {string} creatingElementOfType
     * @param event
     * @param {number} newId
     * @returns {any}
     */
    private initializeNewMarker(creatingElementOfType: string, event, newId: number): any {
        let iconUrl;
        switch (creatingElementOfType) {
            case "stop":
                iconUrl = require<any>("../images/transport/bus.png");
                break;
            case "platform":
                iconUrl = require<any>("../images/transport/platform.png");
                break;
            default:
                iconUrl = require<any>("../../node_modules/leaflet/dist/images/marker-icon.png");
        }
        const marker = L.marker(event["latlng"], {
            icon: L.icon({
                iconUrl
            }),
            riseOnHover: true,
            draggable: true
        }).bindPopup("New " + creatingElementOfType + " #" + newId, {
            offset: L.point(12, 6)
        });
        marker.options["featureId"] = newId;
        marker.options["lat"] = event["latlng"].lat;
        marker.options["lng"] = event["latlng"].lng;
        return marker;
    }

    private findNewId(): number {
        let newId: number = -1;
        while (this.storageService.elementsMap.has(newId) && newId > -100) {
            newId--;
        }
        return newId;
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
            alert("FIXME: missing edit id " + JSON.stringify(edit));
        }
        switch (edit.type) {
            case "add tag":
                console.log("LOG (editing s.) Should add tag: ", edit);
                const atElem = this.storageService.elementsMap.get(edit.id);
                atElem.tags[edit.change.key] = edit.change.value;
                console.log("LOG (editing s.) Added again", atElem);
                this.processingService.refreshTagView(atElem);
                this.storageService.elementsMap.set(edit.id, atElem);
                break;
            case "remove tag":
                console.log("LOG (editing s.) Should remove tag: ", edit);
                const rtElem = this.storageService.elementsMap.get(edit.id);
                delete rtElem.tags[edit.change.key];
                console.log("LOG (editing s.) Removed again", rtElem);
                this.processingService.refreshTagView(rtElem);
                this.storageService.elementsMap.set(edit.id, rtElem);
                break;
            case "change tag":
                console.log("LOG (editing s.) Should reapply this changed tag: ", edit);
                const chtElem = this.storageService.elementsMap.get(edit.id);
                delete chtElem.tags[edit.change.from.key];
                chtElem.tags[edit.change.to.key] = edit.change.to.value;
                console.log("LOG (editing s.) Changed again", chtElem);
                this.processingService.refreshTagView(chtElem);
                this.storageService.elementsMap.set(edit.id, chtElem);
                break;
            case "change members":
                console.log("LOG (editing s.) Should reapply this changed members", edit);
                let chmElem = this.storageService.elementsMap.get(edit.id);
                chmElem.members = edit.change.to;
                this.storageService.elementsMap.set(edit.id, chmElem);
                this.processingService.filterStopsByRelation(this.storageService.elementsMap.get(edit.id));
                this.processingService.exploreRelation(this.storageService.elementsMap.get(edit.id));
                break;
            case "add element":
                console.log("LOG (editing s.) Should recreate this created element", edit);
                this.storageService.elementsMap.set(edit.id, edit.change.to);
                this.mapService.map.addLayer(this.storageService.markersMap.get(edit.id));
                this.processingService.refreshTagView(this.storageService.elementsMap.get(edit.id));
                break;
            case "modify element":
                console.log("LOG: Should reapply element modification", edit);
                const mElem = this.storageService.elementsMap.get(edit.id);
                mElem.lat = edit.change.to.lat;
                mElem.lon = edit.change.to.lon;

                const marker = this.storageService.markersMap.get(edit.id);
                marker.setLatLng({ lat: mElem.lat, lng: mElem.lon });
                this.storageService.elementsMap.set(edit.id, mElem);
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(edit));
        }
        const element = this.processingService.getElementById(edit["id"]);
        this.processingService.zoomToElement(element);
    }

    /**
     * Undoes/deletes current step of edit.
     * @param edit - edit object
     */
    private undoChange(edit: any): void {

        switch (edit.type) {
            case "add tag":
                console.log("LOG (editing s.) Should remove this added tag: ", edit);
                const atElem = this.storageService.elementsMap.get(edit.id);
                delete atElem.tags[edit.change.key];
                console.log("LOG (editing s.) Removed again", atElem);
                this.processingService.refreshTagView(atElem);
                this.storageService.elementsMap.set(edit.id, atElem);
                break;
            case "remove tag":
                console.log("LOG (editing s.) Should add this removed tag: ", edit);
                const rtElem = this.storageService.elementsMap.get(edit.id);
                rtElem.tags[edit.change.key] = edit.change.value;
                console.log("LOG (editing s.) Added again", rtElem);
                this.processingService.refreshTagView(rtElem);
                this.storageService.elementsMap.set(edit.id, rtElem);
                break;
            case "change tag":
                console.log("LOG (editing s.) Should undo this changed tag: ", edit);
                const chtElem = this.storageService.elementsMap.get(edit.id);
                delete chtElem.tags[edit.change.to.key];
                chtElem.tags[edit.change.from.key] = edit.change.from.value;
                console.log("LOG (editing s.) Changed again", chtElem);
                this.processingService.refreshTagView(chtElem);
                this.storageService.elementsMap.set(edit.id, chtElem);
                break;
            case "change members":
                console.log("LOG (editing s.) Should undo this changed members", edit);
                let chmElem = this.storageService.elementsMap.get(edit.id);
                delete chmElem.members;
                chmElem.members = edit.change.from;
                this.storageService.elementsMap.set(edit.id, chmElem);
                // this.processingService.refreshSidebarView("stop");
                this.processingService.filterStopsByRelation(this.storageService.elementsMap.get(edit.id));
                this.processingService.exploreRelation(this.storageService.elementsMap.get(edit.id));
                break;
            case "add element":
                console.log("LOG (editing s.) Should undo this created element", edit);
                this.mapService.map.removeLayer(this.storageService.markersMap.get(edit.id));
                this.processingService.refreshTagView(this.storageService.elementsMap.get(edit.id));
                break;
            case "modify element":
                console.log("LOG: Should undo element modification", edit);
                const mElem = this.storageService.elementsMap.get(edit.id);
                mElem.lat = edit.change.from.lat;
                mElem.lon = edit.change.from.lon;

                const marker = this.storageService.markersMap.get(edit.id);
                marker.setLatLng({ lat: mElem.lat, lng: mElem.lon });
                this.storageService.elementsMap.set(edit.id, mElem);
                break;
            default:
                alert("Current change type was not recognized " + JSON.stringify(edit));
        }
        const element = this.processingService.getElementById(edit["id"]);
        this.processingService.zoomToElement(element);
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

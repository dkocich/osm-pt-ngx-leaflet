import {Component, ViewChild} from "@angular/core";

import {EditingService} from "../../services/editing.service";
import {MapService} from "../../services/map.service";
import {StorageService} from "../../services/storage.service";

import {ModalDirective} from "ngx-bootstrap";

@Component({
    providers: [],
    selector: "editor",
    styles: [
        require<any>("./editor.component.less"),
        require<any>("../../styles/main.less")
    ],
    template: require<any>("./editor.component.html")
})
export class EditorComponent {
    private totalEditSteps: number = 0;
    private currentEditStep: number = 0;
    private editing: boolean = false;

    constructor(private mapService: MapService, private storageService: StorageService,
                private editingService: EditingService) {
    }

    @ViewChild("editModal") public editModal: ModalDirective;

    ngOnInit() {
        this.editingService.currentTotalSteps.subscribe(
            (data) => {
                // console.log("subscribed to counter ", data);
                this.currentEditStep = data.current;
                this.totalEditSteps = data.total;
            }
        );
    }

    ngAfterViewInit() {
        if (this.storageService.getLocalStorageItem("edits")) {
            this.editModal.show();
        } else {
            this.storageService.setLocalStorageItem("edits", []);
        }
        console.log("LOG: Current edits are: ", this.storageService.edits);
    }

    /**
     * Deletes current edits create in the localStorage.
     */
    private deleteEdits(): void {
        localStorage.removeItem("edits");
        alert(this.storageService.edits);
        alert("LOG: LocalStorage changed to " + localStorage.getItem("edits"));
        this.editModal.hide();
    }

    /**
     * Provides access to editing service function.
     */
    private continueEditing(): void {
        this.storageService.edits = this.storageService.getLocalStorageItem("edits");
        this.editModal.hide();
        this.editingService.continueEditing();
    }

    private showEditModal(): void {
        this.editModal.show();
    }

    private hideEditModal(): void {
        this.editModal.hide();
    }

    /**
     * Provides access to editing service function.
     */
    private stepBackward(): void {
        this.currentEditStep--;
        this.editingService.currentTotalSteps.emit({
            "current": this.currentEditStep, "total": this.totalEditSteps
        });
        this.editingService.step("backward");
    }

    /**
     * Provides access to editing service function.
     */
    private stepForward(): void {
        this.currentEditStep++;
        console.log(this.currentEditStep, this.totalEditSteps);
        this.editingService.currentTotalSteps.emit({
            "current": this.currentEditStep, "total": this.totalEditSteps});
        this.editingService.step("forward");
    }

    /**
     * Provides access to editing service function.
     * @param type
     */
    private createElement(type: string): void {
        this.editingService.createNewElement(type);
    }

    /**
     * Checks if buttons used to move between edits should be active.
     * @param type - "forward" or "backward" button
     * @returns {boolean} - when true then button is disabled
     */
    private isInactive(type: string): boolean {
        // console.log(this.totalEditSteps, this.currentEditStep);
        switch (type) {
            case "backward":
                return this.totalEditSteps - this.currentEditStep === this.totalEditSteps;
            case "forward":
                return this.currentEditStep === this.totalEditSteps;
        }
    }

    /**
     * Activates editing mode (locally/globally).
     */
    private toggleEditMode(): void {
        this.editing = !this.editing;
        this.editingService.editingMode.emit(this.editing);
        this.mapService.editingMode = this.editing;
    }
}

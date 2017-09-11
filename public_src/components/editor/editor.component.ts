import { Component, ViewChild } from "@angular/core";

import { AuthService } from "../../services/auth.service";
import { EditingService } from "../../services/editing.service";
import { MapService } from "../../services/map.service";
import { StorageService } from "../../services/storage.service";

import { ModalDirective } from "ngx-bootstrap";

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
    @ViewChild("editModal") public editModal: ModalDirective;
    private totalEditSteps: number = 0;
    private currentEditStep: number = 0;
    private editing: boolean = false;
    private creatingElementOfType: string = "";

    constructor(private mapService: MapService, private storageService: StorageService,
                private editingService: EditingService, private authService: AuthService) {
    }

    ngOnInit(): void {
        this.editingService.currentTotalSteps.subscribe(
            (data) => {
                // console.log("LOG (editor) subscribed to counter ", data);
                this.currentEditStep = data.current;
                this.totalEditSteps = data.total;
            }
        );
        this.mapService.map.on("click", (event: MouseEvent) => {
            if (this.editing && this.creatingElementOfType !== "") {
                this.editingService.createElement(this.creatingElementOfType, event);
                this.creatingElementOfType = "";
            }
        });
    }

    ngAfterViewInit(): void {
        if (this.storageService.getLocalStorageItem("edits")) {
            this.editModal.show();
        } else {
            this.storageService.setLocalStorageItem("edits", []);
        }
        console.log("LOG (editor) Current edits are: ", this.storageService.edits);
    }

    private isAuthenticated(): void {
        return this.authService.oauth.authenticated();
    }

    /**
     * Deletes current edits create in the localStorage.
     */
    private deleteEdits(): void {
        localStorage.removeItem("edits");
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
        console.log("LOG (editor)", this.currentEditStep, this.totalEditSteps);
        this.editingService.currentTotalSteps.emit({
            "current": this.currentEditStep, "total": this.totalEditSteps});
        this.editingService.step("forward");
    }

    /**
     * Provides access to editing service function.
     * @param type
     */
    private createElement(type: string): void {
        if (this.creatingElementOfType === type) {
            this.creatingElementOfType = "";
        } else {
            this.creatingElementOfType = type;
        }
    }

    /**
     * Checks if buttons used to move between edits should be active.
     * @param type - "forward" or "backward" button
     * @returns {boolean} - when true then button is disabled
     */
    private isInactive(type: string): boolean {
        this.mapService.disableMouseEvent("edits-backward-btn");
        this.mapService.disableMouseEvent("edits-forward-btn");
        // console.log("LOG (editor)", this.totalEditSteps, this.currentEditStep);
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
        if (this.editing) {
            setTimeout( () => {
                this.mapService.disableMouseEvent("edits-backward-btn");
                this.mapService.disableMouseEvent("edits-forward-btn");
                this.mapService.disableMouseEvent("edits-count");
                this.mapService.disableMouseEvent("stop-btn");
                this.mapService.disableMouseEvent("platform-btn");
            }, 250);
        }
    }
}

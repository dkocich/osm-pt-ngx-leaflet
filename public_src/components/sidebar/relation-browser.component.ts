import { Component } from "@angular/core";

import { ProcessingService } from "../../services/processing.service";
import { StorageService } from "../../services/storage.service";
import { EditingService } from "../../services/editing.service";

@Component({
    providers: [],
    selector: "relation-browser",
    styles: [
        require<any>("./relation-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    template: require<any>("./relation-browser.component.html")
})
export class RelationBrowserComponent {
    private currentElement: any = { type: "not selected" };
    private listOfVariants = this.storageService.listOfVariants;
    private editingMode: boolean;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService,
                private editingService: EditingService) {
    }

    ngOnInit(): void {
        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "tag") {
                    console.log("LOG (tag-browser) Current selected element changed - ", data);
                    this.currentElement = this.storageService.currentElement;
                } else if (data === "cancel selection") {
                    this.currentElement = undefined;
                    delete this.currentElement;
                    this.storageService.listOfVariants.length = 0;
                    this.listOfVariants.length = 0;
                }
            }
        );

        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "relation") {
                    this.listOfVariants = this.storageService.listOfVariants;
                    console.log("LOG (relation) List of variants " , this.storageService.listOfVariants,
                        " currentElement", this.storageService.currentElement);
                }
            }
        );
        this.editingService.editingMode.subscribe(
            (data) => {
                console.log("LOG (route-browser) Editing mode change in routeBrowser - ", data);
                this.editingMode = data;
            }
        );
    }

    private isDownloaded(relId: number): boolean {
        return this.storageService.elementsDownloaded.has(relId) || relId < 0; // show created
    }

    private exploreRelation($event: any, rel: any): void {
        this.processingService.exploreRelation(this.storageService.elementsMap.get(rel.id),
            true, false, true);
    }

    private hasMaster(): boolean {
        if (this.currentElement) {
            return this.storageService.idsHaveMaster.has(this.currentElement.id);
        }
        return false;
    }

    private createMaster(): void {
        if (this.currentElement.id) {
            this.editingService.createMaster(this.currentElement.id);
        } else {
            this.editingService.createMaster();
        }
    }
}

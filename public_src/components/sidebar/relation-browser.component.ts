import { Component } from "@angular/core";

import { ProcessingService } from "../../services/processing.service";
import { StorageService } from "../../services/storage.service";

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
    private listOfVariants = this.storageService.listOfVariants;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService) {
    }

    ngOnInit() {
        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "relation") {
                    this.listOfVariants = this.storageService.listOfVariants;
                    console.log("LOG (relation) List of variants " , this.storageService.listOfVariants);
                }
            }
        );
    }

    private isDownloaded(relId) {
        this.storageService.elementsDownloaded.has(relId);
    }

    private exploreRelation($event, rel: any): void {
        this.processingService.exploreRelation(rel, true, false, true);
    }
}

import {Component} from "@angular/core";

import {ProcessingService} from "../../services/processing.service";
import {StorageService} from "../../services/storage.service";

@Component({
    selector: "relation-browser",
    template: require<any>("./relation-browser.component.html"),
    styles: [
        require<any>("./relation-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class RelationBrowserComponent {
    private listOfVariants = this.storageService.listOfVariants;

    constructor(private storageService: StorageService,
                private processingService: ProcessingService) {
    }

    ngOnInit() {
        this.processingService.refreshSidebarViews$.subscribe(
            data => {
                if (data === "relation") {
                    this.listOfVariants = this.storageService.listOfVariants;
                    console.log("LOG: list of variants " , this.storageService.listOfVariants);
                }
            }
        );
    }

    private exploreRelation($event, rel: any): void {
        this.processingService.exploreRelation(rel);
    }
}

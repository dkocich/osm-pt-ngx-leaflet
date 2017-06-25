import {Component, Input} from "@angular/core";

import {ProcessingService} from "../../services/processing.service";
import {StorageService} from "../../services/storage.service";

@Component({
    selector: "tag-browser",
    template: require<any>("./tag-browser.component.html"),
    styles: [
        require<any>("./tag-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class TagBrowserComponent {
    private elementTags: object;

    @Input() tagKey: string = "";
    @Input() tagValue: string = "";

    private elementChanges: any = [];

    constructor(private processingService: ProcessingService,
                private storageService: StorageService) { }

    ngOnInit() {
        this.processingService.refreshSidebarViews$.subscribe(
            data => {
                if (data === "tag") {
                    this.elementTags = this.storageService.currentElement;
                }
            }
        );
    }

    private updateKey(value: string) { this.tagKey = value; }

    private updateValue(value: string) { this.tagValue = value; }

    private appendNewTag() {
        console.log("LOG: Added tags are: ", this.tagKey, this.tagValue);
        this.elementTags[this.tagKey] = this.tagValue;
        this.tagKey = this.tagValue = "" ;
    }

    private isUnchanged() {
        return !this.tagKey || !this.tagValue;
    }
}

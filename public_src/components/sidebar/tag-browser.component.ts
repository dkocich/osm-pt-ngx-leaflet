import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input} from "@angular/core";

import {ProcessingService} from "../../services/processing.service";
import {StorageService} from "../../services/storage.service";
import {EditingService} from "../../services/editing.service";

import {OsmEntity} from "../../core/osmEntity.interface";

@Component({
    selector: "tag-browser",
    template: require<any>("./tag-browser.component.html"),
    styles: [
        require<any>("./tag-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: [],
    changeDetection: ChangeDetectionStrategy.Default
})
export class TagBrowserComponent {
    private currentElement: OsmEntity;
    private editingMode: boolean;

    @Input() tagKey: string = "";
    @Input() tagValue: string = "";

    constructor(private processingService: ProcessingService,
                private storageService: StorageService,
                private editingService: EditingService,
                private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.processingService.refreshSidebarViews$.subscribe(
            data => {
                if (data === "tag") {
                    console.log("Current selected element changed - ", data);
                    this.currentElement = this.storageService.currentElement;
                }
            }
        );

        this.editingService.editingMode.subscribe(
            /**
             * @param data
             */
            (data) => {
                console.log("Editing mode change in tagBrowser - ", data);
                this.editingMode = data;
            }
        );
    }

    private createChange(type: string, key?: string, event?): void {
        let change: object;

        if (type === "change tag") {

            // FIXME quit function when user leaves input field without any change
            if (key === event.target.value || key === this.currentElement.tags[key]) {
                console.log("LOG: no input edit change, should quit");
                return;
            }

            // handles changes from one of two input text areas
            switch (event.target["dataset"].type) {
                case "key":
                    change = {
                        "from": {"key": key, "value": this.currentElement.tags[key] },
                        "to": {"key": event.target.value, "value": this.currentElement.tags[key] }
                    };
                    delete this.currentElement.tags[key];
                    this.currentElement.tags[event.target.value] = this.currentElement.tags[key];
                    break;
                case "value":
                    change = {
                        "from": {"key": key, "value": this.currentElement.tags[key] },
                        "to": {"key": key, "value": event.target.value }
                    };
                    delete this.currentElement.tags[key];
                    this.currentElement.tags[key] = event.target.value;
                    break;
                default:
                    alert("form type not found");
            }
            // console.log("LOG: Changed tags are: ", this.tagKey, this.tagValue, event);

        } else if (type === "add tag") {
            console.log("LOG: Added tags are", key, this.currentElement.tags[key],
                " for object: ", this.currentElement);
            this.currentElement.tags[this.tagKey] = this.tagValue;
            this.storageService.currentElement.tags[this.tagKey] = this.tagValue;
            change = {"key": this.tagKey, "value": this.tagValue };
            this.tagKey = this.tagValue = "";

        } else if (type === "remove tag") {
            console.log("LOG: Removed tags are", this.currentElement, key, this.currentElement.tags[key],
                " for object: ", this.currentElement);
            change = {"key": key, "value": this.currentElement.tags[key] };

            delete this.currentElement.tags[key];
            delete this.storageService.currentElement["tags"][key];
        }
        this.editingService.addChange(this.currentElement, type, change);
        this.cd.detectChanges();
        this.cd.markForCheck();
    }

    private updateKey(value: string): void {
        this.tagKey = value;
    }

    private updateValue(value: string): void {
        this.tagValue = value;
    }

    private isUnchanged() {
        return !this.tagKey || !this.tagValue;
    }

    private keyChange($event) {
        console.log($event);
    }

    private valueChange($event) {
        console.log($event);
    }
}

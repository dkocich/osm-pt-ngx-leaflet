import { Component, ViewChild } from "@angular/core";

import { EditorComponent } from "../editor/editor.component";
import { TransporterComponent } from "../transporter/transporter.component";

import { ConfigService } from "../../services/config.service";
import { MapService } from "../../services/map.service";
import { OverpassService } from "../../services/overpass.service";
import { ProcessingService } from "../../services/processing.service";
import { StorageService } from "../../services/storage.service";

import { IOsmEntity } from "../../core/osmEntity.interface";

@Component({
    providers: [],
    selector: "toolbar",
    styles: [
        require<any>("./toolbar.component.less"),
        require<any>("../../styles/main.less")
    ],
    template: require<any>("./toolbar.component.html")
})
export class ToolbarComponent {
    public downloading: boolean;
    public htRadioModel: string = "Stops";
    @ViewChild(TransporterComponent) public transporterComponent: TransporterComponent;
    @ViewChild(EditorComponent) public editorComponent: EditorComponent;
    private filtering: boolean;

    private currentElement: IOsmEntity;
    private stats = { s: 0, r: 0, a: 0, m: 0 };

    constructor(private mapService: MapService, private overpassService: OverpassService,
                private configService: ConfigService, private storageService: StorageService,
                private processingService: ProcessingService) {
        this.downloading = true;
        this.filtering = this.configService.cfgFilterLines;
        this.processingService.refreshSidebarViews$.subscribe(
            (data) => {
                if (data === "tag") {
                    console.log("LOG (toolbar) Current selected element changed - ", data);
                    this.currentElement = this.storageService.currentElement;
                }
            }
        );
        this.storageService.stats.subscribe((data) => this.stats = data);
    }

    ngOnInit() {
        this.mapService.disableMouseEvent("toggle-download");
        this.mapService.disableMouseEvent("toggle-filter");
        this.mapService.disableMouseEvent("toggle-edit");
        this.mapService.disableMouseEvent("edits-backward-btn");
        this.mapService.disableMouseEvent("edits-forward-btn");
        this.mapService.disableMouseEvent("edits-count");
    }

    public Initialize() {
        this.mapService.map.on("zoomend moveend", () => {
            this.initDownloader();
        });
    }

    private changeHighlight() {
        console.log(this.htRadioModel);
        if (this.highlightIsActive() && this.htRadioModel !== this.mapService.highlightType) {
            this.mapService.highlightType = this.htRadioModel;
            this.processingService.exploreRelation(this.storageService.elementsMap.get(this.currentElement.id));
        }
    }

    private initDownloader(): void {
        if (this.checkDownloadRules()) {
            this.overpassService.requestNewOverpassData();
        }
    }

    private checkMinZoomLevel (): boolean {
        return this.mapService.map.getZoom() > this.configService.minDownloadZoom;
    }

    private checkMinDistance(): boolean {
        const lastDownloadCenterDistance = this.mapService.map.getCenter().distanceTo(this.mapService.previousCenter);
        return lastDownloadCenterDistance > this.configService.minDownloadDistance;
    }

    private checkDownloadRules(): boolean {
        return this.checkMinZoomLevel() && this.checkMinDistance();
    }

    private toggleDownloading(): void {
        this.downloading = !this.downloading;
        if (this.downloading) {
            this.mapService.map.on("zoomend moveend", () => {
                this.initDownloader();
            });
        } else if (!this.downloading) {
            this.mapService.map.off("zoomend moveend");
        }
    }

    /**
     *
     * @param selection
     */
    private showInfo(selection: object) {
        alert(JSON.stringify(selection, null, "\t"));
    }

    private zoomTo(selection: IOsmEntity) {
        this.processingService.zoomToElement(selection);
    }

    private showOptions(): void {
        document.getElementById("toggle-filter").style.display = "inline";
        setTimeout( () => {
            document.getElementById("toggle-filter").style.display = "none";
        }, 5000);
    }

    private toggleLinesFilter(): void {
        this.configService.cfgFilterLines = !this.configService.cfgFilterLines;
        this.filtering = !this.filtering;
    }

    private highlightIsActive() {
        return this.mapService.highlightIsActive();
    }

    private clearHighlight() {
        return this.mapService.clearHighlight();
    }
}

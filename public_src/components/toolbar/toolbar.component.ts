import {Component, ViewChild} from "@angular/core";
import {MapService} from "../../services/map.service";
import {TransporterComponent} from "../transporter/transporter.component";
import {OverpassService} from "../../services/overpass.service";

@Component({
    selector: "toolbar",
    template: require<any>("./toolbar.component.html"),
    styles: [
        require<any>("./toolbar.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class ToolbarComponent {
    downloading: boolean;

    @ViewChild(TransporterComponent) transporterComponent: TransporterComponent;

    constructor(private mapService: MapService, private overpassService: OverpassService) {
        this.downloading = true;
    }

    ngOnInit() {
        this.mapService.disableMouseEvent("toggle-download");
    }

    Initialize() {
        this.mapService.map.on("zoomend moveend", () => {
            this.initDownloader();
        });
    }

    private initDownloader(): void {
        if (this.checkDownloadRules()) this.overpassService.requestNewOverpassData();
    }

    private checkMinZoomLevel (): boolean {
        return this.mapService.map.getZoom() > 15;
    }

    private checkMinDistance(): boolean {
        let lastDownloadCenterDistance = this.mapService.map.getCenter().distanceTo(this.mapService.previousCenter);
        return lastDownloadCenterDistance > 5000;
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
        } else if (!this.downloading) this.mapService.map.off("zoomend moveend");
    }
}

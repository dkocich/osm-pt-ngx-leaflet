import { Component, isDevMode, ViewChild } from "@angular/core";
import { CarouselConfig, ModalDirective } from "ngx-bootstrap";

import * as L from "leaflet";

import { GeocodingService } from "../../services/geocoding.service";
import { LoadingService } from "../../services/loading.service";
import { MapService } from "../../services/map.service";
import { ProcessingService } from "../../services/processing.service";

import { AuthComponent } from "../auth/auth.component";
import { ToolbarComponent } from "../toolbar/toolbar.component";
import { EditingService } from "../../services/editing.service";
import { StorageService } from "../../services/storage.service";

@Component({
    providers: [{ provide: CarouselConfig, useValue: { noPause: false } }],
    selector: "app",
    styles: [
        require<any>("./app.component.less")
    ],
    template: require<any>("./app.component.html")
})
export class AppComponent {
    public advancedMode: boolean = Boolean(localStorage.getItem("advancedMode"));
    private editingMode: boolean;

    @ViewChild(ToolbarComponent) public toolbarComponent: ToolbarComponent;
    @ViewChild(AuthComponent) public authComponent: AuthComponent;
    @ViewChild("helpModal") public helpModal: ModalDirective;

    constructor(private mapService: MapService, private geocoder: GeocodingService,
                private loadingService: LoadingService, private processingService: ProcessingService,
                private editingService: EditingService, private storageService: StorageService) {
        if (isDevMode()) {
            console.log("WARNING: Ang. development mode is ", isDevMode());
        }
    }

    ngOnInit(): any {
        this.editingService.editingMode.subscribe(
            (data) => {
                console.log("LOG (relation-browser) Editing mode change in routeBrowser - ", data);
                this.editingMode = data;
            }
        );
        const map = L.map("map", {
            center: L.latLng(49.686, 18.351),
            layers: [this.mapService.baseMaps.CartoDB_light],
            maxZoom: 22,
            minZoom: 4,
            zoom: 14,
            zoomAnimation: false,
            zoomControl: false
        });

        L.control.zoom({ position: "topright" }).addTo(map);
        L.control.layers(this.mapService.baseMaps).addTo(map);
        L.control.scale().addTo(map);

        this.mapService.map = map;
        this.mapService.map.on("zoomend moveend", () => {
            this.processingService.filterDataInBounds();
            this.processingService.addPositionToUrlHash();
        });
        if (window.location.hash !== "" && this.processingService.hashIsValidPosition()) {
            this.mapService.zoomToHashedPosition();
        } else {
            this.geocoder.getCurrentLocation()
                .subscribe(
                    (location) => map.panTo([location.latitude, location.longitude]),
                    (err) => console.error(err)
                );
        }
        this.toolbarComponent.Initialize();

        this.processingService.loadSavedDataFromLocalStorage(); // try to restore any cached data
        setInterval(() => {
            if (Number(localStorage.getItem("dataLastSize")) >= this.storageService.elementsMap.size) {
               return; // should not run data backup if count did not change
            }
            localStorage.setItem("dataLastSize", JSON.stringify(this.storageService.elementsMap.size));
            let dataObject = [];
            for (const key of Array.from(this.storageService.elementsMap.keys())) {
                dataObject.push({
                    downloaded: this.storageService.elementsDownloaded.has(key),
                    element: this.storageService.elementsMap.get(key),
                    timestamp: Date.now()
                });
            }
            localStorage.setItem("dataString", JSON.stringify(dataObject));
        }, 5000);
    }

    private showHelpModal(): void {
        this.helpModal.show();
    }

    private hideHelpModal(): void {
        this.helpModal.hide();
    }

    private isLoading(): boolean {
        return this.loadingService.isLoading();
    }

    private getStatus(): string {
        return this.loadingService.getStatus();
    }

    private changeMode(): void {
        localStorage.setItem("advancedMode", JSON.stringify(this.advancedMode));
    }
}

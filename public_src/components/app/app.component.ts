import { Component, isDevMode, ViewChild } from "@angular/core";
import { CarouselConfig, ModalDirective } from "ngx-bootstrap";

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
        });
        this.geocoder.getCurrentLocation()
            .subscribe(
                (location) => map.panTo([location.latitude, location.longitude]),
                (err) => console.error(err)
            );
        this.toolbarComponent.Initialize();

        this.storageService.loadSavedData();

        setInterval( () => {

            console.log("... size now is ", this.storageService.elementsMap.size);

            if (Number(localStorage.getItem("dataLastSize")) >= this.storageService.elementsMap.size) {
               return;
            }

            console.log("RUNNING DATA BACKUP TO LOCALSTORAGE");
            localStorage.setItem("dataLastSize", JSON.stringify(this.storageService.elementsMap.size));
            let dataObject = [];
            for (const [key, element] of Array.from(this.storageService.elementsMap.entries()) ) {
               // console.log(key, object, [key, object]);
               dataObject.push({ key, element, t: Date.now() });
            }
            let dataString = JSON.stringify(dataObject);
            localStorage.setItem("dataString", JSON.stringify(dataString));
            console.log("BACKED UP DATA");

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

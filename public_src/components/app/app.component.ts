import { Component, ViewChild } from "@angular/core";
import { CarouselConfig, ModalDirective } from "ngx-bootstrap";

import { GeocodingService } from "../../services/geocoding.service";
import { LoadingService } from "../../services/loading.service";
import { MapService } from "../../services/map.service";
import { ProcessingService } from "../../services/processing.service";

import { AuthComponent } from "../auth/auth.component";
import { ToolbarComponent } from "../toolbar/toolbar.component";

@Component({
    providers: [{ provide: CarouselConfig, useValue: { noPause: false } }],
    selector: "app",
    styles: [
        require<any>("./app.component.less")
    ],
    template: require<any>("./app.component.html")
})
export class AppComponent {

    @ViewChild(ToolbarComponent) public toolbarComponent: ToolbarComponent;
    @ViewChild(AuthComponent) public authComponent: AuthComponent;
    @ViewChild("helpModal") public helpModal: ModalDirective;

    constructor(private mapService: MapService, private geocoder: GeocodingService,
                private loadingService: LoadingService, private processingService: ProcessingService) {
    }

    ngOnInit(): any {
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
}

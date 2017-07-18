import {Component, ViewChild} from "@angular/core";
import {CarouselConfig, ModalDirective} from "ngx-bootstrap";

import {GeocodingService} from "../../services/geocoding.service";
import {LoadingService} from "../../services/loading.service";
import {MapService} from "../../services/map.service";
import {ProcessingService} from "../../services/processing.service";

import {AuthComponent} from "../auth/auth.component";
import {ToolbarComponent} from "../toolbar/toolbar.component";

@Component({
    providers: [{provide: CarouselConfig, useValue: {noPause: false}}],
    selector: "app",
    styles: [
        require<any>("./app.component.less")
    ],
    template: require<any>("./app.component.html")
})
export class AppComponent {

    @ViewChild(ToolbarComponent) toolbarComponent: ToolbarComponent;
    @ViewChild(AuthComponent) authComponent: AuthComponent;

    constructor(private mapService: MapService, private geocoder: GeocodingService,
                private loadingService: LoadingService, private processingService: ProcessingService) {
    }

    @ViewChild("helpModal") public helpModal: ModalDirective;

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

    ngOnInit() {
        let map = L.map("map", {
            zoomAnimation: false,
            zoomControl: false,
            center: L.latLng(49.686, 18.351),
            zoom: 14,
            minZoom: 4,
            maxZoom: 22,
            layers: [this.mapService.baseMaps.CartoDB_light]
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
}

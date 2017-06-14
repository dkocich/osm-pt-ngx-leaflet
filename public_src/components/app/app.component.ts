import {Component, ViewChild} from "@angular/core";
import {ToolbarComponent} from "../toolbar/toolbar.component";
import {MapService} from "../../services/map.service";
import {GeocodingService} from "../../services/geocoding.service";
import {AuthComponent} from "../auth/auth.component";
import {CarouselConfig, ModalDirective} from "ngx-bootstrap";
import {LoadingService} from "../../services/loading.service";
import {ProcessingService} from "../../services/processing.service";

@Component({
    selector: "app",
    template: require<any>("./app.component.html"),
    styles: [
        require<any>("./app.component.less")
    ],
    providers: [{provide: CarouselConfig, useValue: {noPause: false}}]
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

    ngOnInit() {
        let map = L.map("map", {
            zoomControl: false,
            center: L.latLng(49.686, 18.351),
            zoom: 14,
            minZoom: 4,
            maxZoom: 22,
            layers: [this.mapService.baseMaps.CartoDB]
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
                location => map.panTo([location.latitude, location.longitude]),
                err => console.error(err)
            );
        this.toolbarComponent.Initialize();
    }
}

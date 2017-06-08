import {Component, ViewChild} from "@angular/core";
import {ToolbarComponent} from "../toolbar/toolbar.component";
import {MapService} from "../../services/map.service";
import {GeocodingService} from "../../services/geocoding.service";
import {AuthComponent} from "../auth/auth.component";

@Component({
    selector: "app",
    template: require<any>("./app.component.html"),
    styles: [
        require<any>("./app.component.less")
    ],
    providers: []
})
export class AppComponent {

    @ViewChild(ToolbarComponent) toolbarComponent: ToolbarComponent;
    @ViewChild(AuthComponent) authComponent: AuthComponent;

    constructor(private mapService: MapService, private geocoder: GeocodingService) {
    }

    ngOnInit() {
        let map = L.map("map", {
            zoomControl: false,
            center: L.latLng(49.686, 18.351),
            zoom: 12,
            minZoom: 4,
            maxZoom: 19,
            layers: [this.mapService.baseMaps.OpenStreetMap]
        });

        L.control.zoom({ position: "topright" }).addTo(map);
        L.control.layers(this.mapService.baseMaps).addTo(map);
        L.control.scale().addTo(map);

        this.mapService.map = map;
        this.geocoder.getCurrentLocation()
            .subscribe(
                location => map.panTo([location.latitude, location.longitude]),
                err => console.error(err)
            );
        this.toolbarComponent.Initialize();
    }
}

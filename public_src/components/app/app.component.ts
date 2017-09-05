import { Component, isDevMode, NgZone, ViewChild } from "@angular/core";
import { CarouselConfig, ModalDirective } from "ngx-bootstrap";

import { GeocodingService } from "../../services/geocoding.service";
import { LoadingService } from "../../services/loading.service";
import { MapService } from "../../services/map.service";
import { ProcessingService } from "../../services/processing.service";

import { AuthComponent } from "../auth/auth.component";
import { ToolbarComponent } from "../toolbar/toolbar.component";
import { EditingService } from "../../services/editing.service";

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
    public element: HTMLElement;

    @ViewChild(ToolbarComponent) public toolbarComponent: ToolbarComponent;
    @ViewChild(AuthComponent) public authComponent: AuthComponent;
    @ViewChild("helpModal") public helpModal: ModalDirective;

    constructor(private mapService: MapService, private geocoder: GeocodingService,
                private loadingService: LoadingService, private processingService: ProcessingService,
                private editingService: EditingService, private zone: NgZone) {
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
        this.mapService.map.on("movestart", () => {
            this.zone.runOutsideAngular(() => {
                window.document.addEventListener("mousemove", this.mouseMove.bind(this));
            });
        });

        this.geocoder.getCurrentLocation()
            .subscribe(
                (location) => map.panTo([location.latitude, location.longitude]),
                (err) => console.error(err)
            );
        this.toolbarComponent.Initialize();
    }

    public mouseDown(event: any): void {
        this.element = event.target;
        this.zone.runOutsideAngular(() => {
            window.document.addEventListener("mousemove", this.mouseMove.bind(this));
        });
    }

    public mouseMove(event: any): void {
        event.preventDefault();
        // this.element.setAttribute("x", event.clientX + this.clientX + "px");
        // this.element.setAttribute("y", event.clientX + this.clientY + "px");
    }

    mouseUp(event: any): void {
        // Run this code inside Angular's Zone and perform change detection
        this.zone.run(() => {
            console.log("MouseUp zone run");
            // this.updateBox(this.currentId, event.clientX + this.offsetX, event.clientY + this.offsetY);
            // this.currentId = null;
        });

        window.document.removeEventListener("mousemove", this.mouseMove);
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

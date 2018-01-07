import { Component, isDevMode, ViewChild } from "@angular/core";
import { CarouselConfig, ModalDirective } from "ngx-bootstrap";

import * as L from "leaflet";

import { Angulartics2Piwik } from "angulartics2/piwik";

import { GeocodeService } from "../../services/geocode.service";
import { LoadService } from "../../services/load.service";
import { MapService } from "../../services/map.service";
import { ProcessService } from "../../services/process.service";

import { AuthComponent } from "../auth/auth.component";
import { ToolbarComponent } from "../toolbar/toolbar.component";
import { EditService } from "../../services/edit.service";

@Component({
  providers: [{ provide: CarouselConfig, useValue: { noPause: false } }],
  selector: "app",
  styles: [require<any>("./app.component.less")],
  template: require<any>("./app.component.html"),
})
export class AppComponent {
  public advancedMode: boolean = Boolean(localStorage.getItem("advancedMode"));
  private editingMode: boolean;

  @ViewChild(ToolbarComponent) public toolbarComponent: ToolbarComponent;
  @ViewChild(AuthComponent) public authComponent: AuthComponent;
  @ViewChild("helpModal") public helpModal: ModalDirective;

  constructor(
    private angulartics2GoogleAnalytics: Angulartics2Piwik,
    private editSrv: EditService,
    private geocodeSrv: GeocodeService,
    private loadSrv: LoadService,
    private mapSrv: MapService,
    private processSrv: ProcessService,
  ) {
    if (isDevMode()) {
      console.log("WARNING: Ang. development mode is ", isDevMode());
    }
  }

  ngOnInit(): any {
    this.editSrv.editingMode.subscribe((data) => {
      console.log(
        "LOG (relation-browser) Editing mode change in routeBrowser - ",
        data,
      );
      this.editingMode = data;
    });
    const map = L.map("map", {
      center: L.latLng(49.686, 18.351),
      layers: [this.mapSrv.baseMaps.CartoDB_light],
      maxZoom: 22,
      minZoom: 4,
      zoom: 14,
      zoomAnimation: false,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.layers(this.mapSrv.baseMaps).addTo(map);
    L.control.scale().addTo(map);

    this.mapSrv.map = map;
    this.mapSrv.map.on("zoomend moveend", () => {
      this.processSrv.filterDataInBounds();
      this.processSrv.addPositionToUrlHash();
    });
    if (
      window.location.hash !== "" && this.processSrv.hashIsValidPosition()
    ) {
      this.mapSrv.zoomToHashedPosition();
    } else {
      this.geocodeSrv
        .getCurrentLocation()
        .subscribe(
          (location) => map.panTo([location.latitude, location.longitude]),
          (err) => console.error(err),
        );
    }
    this.toolbarComponent.Initialize();
  }

  private showHelpModal(): void {
    this.helpModal.show();
  }

  private hideHelpModal(): void {
    this.helpModal.hide();
  }

  private isLoading(): boolean {
    return this.loadSrv.isLoading();
  }

  private getStatus(): string {
    return this.loadSrv.getStatus();
  }

  private changeMode(): void {
    localStorage.setItem("advancedMode", JSON.stringify(this.advancedMode));
  }
}

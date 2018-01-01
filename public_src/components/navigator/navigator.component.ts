import { Component } from "@angular/core";
import { Map } from "leaflet";
import { GeocodingService } from "../../services/geocoding.service";
import { MapService } from "../../services/map.service";

@Component({
  providers: [],
  selector: "navigator",
  styles: [
    require<any>("./navigator.component.less"),
    require<any>("../../styles/main.less")
  ],
  template: require<any>("./navigator.component.html")
})
export class NavigatorComponent {
  public address: string;

  private map: Map;

  constructor(
    private geocoder: GeocodingService,
    private mapService: MapService
  ) {
    this.address = "";
  }

  ngOnInit(): void {
    this.mapService.disableMouseEvent("goto");
    this.mapService.disableMouseEvent("place-input");
    this.map = this.mapService.map;
  }

  public goto(): any {
    if (!this.address) {
      return;
    }

    this.geocoder.geocode(this.address).subscribe(
      (location) => {
        this.map.fitBounds(location.viewBounds, {});
        this.address = location.address;
      },
      (error) => console.error(error)
    );
  }
}
